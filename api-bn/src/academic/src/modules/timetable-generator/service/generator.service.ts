import { prisma } from '#academic/database/index.js';
import type { Prisma } from '#academic/database/index.js';
import { backtrackingEngine } from './backtracking-engine';
import { runEngineInWorker } from './engine-runner';
import { isRedisAvailable, enqueuePreview, getPreviewJob, invalidateRedisHealth } from './timetable-queue';
import type {
  GenerateScheduleOptionsDto,
  CommitScheduleDto,
  GeneratorPreviewResult,
  PreviewJobStatus,
  GeneratePreviewResponse,
} from '../domain';
import { ValidationError } from '#app';
import { getOrchestrator } from '#app/orchestrator.js';

export class GeneratorService {
  async generatePreview(options: GenerateScheduleOptionsDto): Promise<GeneratePreviewResponse> {
    const reqWhere: any = { deletedAt: null };
    if (options.classIds && options.classIds.length > 0) {
      reqWhere.classId = { in: options.classIds };
    }

    const requirements = await prisma.classSubjectRequirement.findMany({
      where: reqWhere,
    });

    if (requirements.length === 0) {
      throw new ValidationError(
        'Belum ada data Kebutuhan Jam Pelajaran (ClassSubjectRequirement). Silakan isi matriks beban jam terlebih dahulu.',
      );
    }

    const [masterClasses, masterSubjects, masterTeachers] = await Promise.all([
      getOrchestrator().masterClass.findByIds([...new Set(requirements.map((r) => r.classId))]),
      getOrchestrator().masterSubject.findByIds([...new Set(requirements.map((r) => r.subjectId))]),
      getOrchestrator().masterTeacher.findByIds([...new Set(requirements.map((r) => r.teacherId).filter(Boolean))] as string[]),
    ]);

    const classMap = new Map(masterClasses.map((c) => [c.id, c]));
    const subjectMap = new Map(masterSubjects.map((s) => [s.id, s]));
    const teacherMap = new Map(masterTeachers.map((t) => [t.id, t]));

    const unavailabilities = await prisma.teacherUnavailability.findMany({
      where: { deletedAt: null },
      include: { lessonHour: true },
    });

    const lessonHours = await prisma.lessonHour.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
    });

    if (lessonHours.length === 0) {
      throw new ValidationError('Belum ada data Jam Pelajaran (LessonHour). Silakan buat jam pelajaran terlebih dahulu.');
    }

    // Ekspansi event menjadi slot jam yang diblokir (berlaku untuk semua kelas)
    const blockedSlots = await this.#getEventBlockedSlots();

    const formatName = (teacher: { prefixTitle?: string | null; fullname?: string | null; suffixTitle?: string | null } | undefined | null) =>
      `${teacher?.prefixTitle?.trim() ? `${teacher.prefixTitle.trim()} ` : ''}${teacher?.fullname?.trim() ?? 'Unassigned'}${teacher?.suffixTitle?.trim() ? `, ${teacher.suffixTitle.trim()}` : ''}`;

    const engineInput = {
      requirements: requirements.map((r) => ({
        classId: r.classId,
        className: classMap.get(r.classId)?.name ?? 'Unknown',
        subjectId: r.subjectId,
        subjectName: subjectMap.get(r.subjectId)?.name ?? 'Unknown',
        teacherId: r.teacherId || '',
        teacherName: r.teacherId ? formatName(teacherMap.get(r.teacherId)) : 'Unassigned',
        weeklyHours: r.weeklyHours,
        maxHoursPerDay: r.maxHoursPerDay,
      })),
      unavailabilities: unavailabilities.map((u) => ({
        teacherId: u.teacherId,
        day: u.day,
        lessonHourId: u.lessonHourId,
      })),
      lessonHours: lessonHours.map((h) => ({
        id: h.id,
        name: h.name,
        order: h.order,
        startTime: h.startTime,
        endTime: h.endTime,
      })),
      blockedSlots,
      workingDays: options.workingDays,
      options: {
        timeoutMs: options.timeoutMs,
        maxAttempts: options.maxAttempts,
        enableBatchTeaching: options.enableBatchTeaching,
      },
    };

    if (await isRedisAvailable()) {
      try {
        // Jalur utama: enqueue ke BullMQ — worker process terpisah yang
        // menjalankan engine. Request langsung balas dengan jobId.
        const jobId = await enqueuePreview(engineInput);
        return { mode: 'queue', jobId };
      } catch {
        // Redis mati di antara health check & enqueue (TOCTOU) → jangan lempar
        // error, jatuh ke fallback inline. Reset cache agar tidak mencoba lagi.
        invalidateRedisHealth();
      }
    }

    // Fallback: Redis tidak tersedia → jalankan engine di worker thread agar
    // event loop utama API tetap bebas. Tidak melempar error hanya karena Redis mati.
    const result = await runEngineInWorker(engineInput, options.timeoutMs ?? 15000);
    return { mode: 'inline', result };
  }

  /** Ambil status & hasil job preview (dipakai frontend saat mem-poll). */
  async getPreviewResult(jobId: string): Promise<PreviewJobStatus> {
    const job = await getPreviewJob(jobId);
    if (!job) return { status: 'not_found' };
    if (job.failedReason) {
      return { status: 'failed', error: job.failedReason };
    }
    if (job.returnvalue) {
      return { status: 'completed', result: job.returnvalue as GeneratorPreviewResult };
    }
    return { status: 'processing' };
  }

  async commitSchedule(data: CommitScheduleDto) {
    if (!data.schedules || data.schedules.length === 0) {
      throw new ValidationError('Daftar jadwal yang akan di-commit tidak boleh kosong.');
    }

    return prisma.$transaction(
      async (tx) => {
        // Re-validasi (di dalam transaksi): pastikan slot hasil generator tidak
        // menabrak event jadwal yang mungkin dibuat/diubah setelah preview.
        const blockedEvents = await this.#getEventBlockedSlots(tx);
        const blockedMap = new Map<string, Set<string>>();
        for (const b of blockedEvents) {
          if (!blockedMap.has(b.day)) blockedMap.set(b.day, new Set());
          for (const id of b.lessonHourIds) blockedMap.get(b.day)!.add(id);
        }
        for (const slot of data.schedules) {
          if (blockedMap.get(slot.day)?.has(slot.lessonHourId)) {
            throw new ValidationError(
              `Tidak dapat mempublikasikan jadwal: slot ${slot.day} jam tersebut sudah terisi event jadwal. Hapus/ubah event terlebih dahulu, atau jalankan ulang generator.`,
            );
          }
        }

      if (data.clearExisting) {
        const activeSchedules = await tx.lessonSchedule.findMany({
          where: { deletedAt: null },
          select: { id: true },
        });
        const scheduleIds = activeSchedules.map((s) => s.id);

        if (scheduleIds.length > 0) {
          await tx.lessonScheduleTeacher.updateMany({
            where: { scheduleId: { in: scheduleIds }, deletedAt: null },
            data: { deletedAt: new Date() },
          });
          await tx.lessonScheduleClass.updateMany({
            where: { scheduleId: { in: scheduleIds }, deletedAt: null },
            data: { deletedAt: new Date() },
          });
          await tx.lessonSchedule.updateMany({
            where: { id: { in: scheduleIds } },
            data: { deletedAt: new Date() },
          });
        }
      }

      let insertedCount = 0;
      for (const slot of data.schedules) {
        const teacherIds = slot.teacherIds?.length ? slot.teacherIds : [slot.teacherId];
        const classIds = slot.classIds?.length ? slot.classIds : [slot.classId];

        const schedule = await tx.lessonSchedule.create({
          data: {
            subjectId: slot.subjectId,
            lessonHourId: slot.lessonHourId,
            day: slot.day,
            status: 'Aktif',
          },
        });

        for (const tId of teacherIds) {
          await tx.lessonScheduleTeacher.create({
            data: { scheduleId: schedule.id, teacherId: tId },
          });
        }

        for (const cId of classIds) {
          await tx.lessonScheduleClass.create({
            data: { scheduleId: schedule.id, classId: cId },
          });
        }

        insertedCount++;
      }

      return { count: insertedCount };
    });
  }

  /** Daftar slot jam yang diblokir oleh event jadwal aktif (berlaku semua kelas). */
  async #getEventBlockedSlots(
    client: Prisma.TransactionClient | typeof prisma = prisma,
  ): Promise<{ day: string; lessonHourIds: string[] }[]> {
    const events = await client.scheduleEvent.findMany({
      where: { deletedAt: null },
      include: { startHour: true },
    });
    const lessonHours = await client.lessonHour.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
    });
    const hourOrderToId = new Map(lessonHours.map((h) => [h.order, h.id]));
    return events.map((ev) => {
      const lessonHourIds: string[] = [];
      for (let o = ev.startHour.order; o < ev.startHour.order + ev.durationHours; o++) {
        const id = hourOrderToId.get(o);
        if (id) lessonHourIds.push(id);
      }
      return { day: ev.day, lessonHourIds };
    });
  }
}

export const generatorService = new GeneratorService();