import { prisma } from '#academic/database/index.js';
import { backtrackingEngine } from './backtracking-engine';
import type { GenerateScheduleOptionsDto, CommitScheduleDto, GeneratorPreviewResult } from '../domain';
import { ValidationError } from '#app';
import { getOrchestrator } from '#app/orchestrator.js';

export class GeneratorService {
  async generatePreview(options: GenerateScheduleOptionsDto): Promise<GeneratorPreviewResult> {
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
      workingDays: options.workingDays,
      options: {
        timeoutMs: options.timeoutMs,
        maxAttempts: options.maxAttempts,
        enableBatchTeaching: options.enableBatchTeaching,
      },
    };

    return backtrackingEngine.solve(engineInput);
  }

  async commitSchedule(data: CommitScheduleDto) {
    if (!data.schedules || data.schedules.length === 0) {
      throw new ValidationError('Daftar jadwal yang akan di-commit tidak boleh kosong.');
    }

    return prisma.$transaction(async (tx) => {
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
}

export const generatorService = new GeneratorService();