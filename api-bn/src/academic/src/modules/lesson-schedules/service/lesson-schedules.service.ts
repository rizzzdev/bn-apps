import { prisma } from '#academic/database/index.js';
import { lessonScheduleRepository } from '#academic/modules/lesson-schedules/repository';
import type { LessonScheduleRepository } from '#academic/modules/lesson-schedules/repository/lesson-schedules.repository';
import { NotFoundError, ValidationError } from '#app';
import { getOrchestrator } from '#app/orchestrator.js';
import type { CreateLessonScheduleDto, UpdateLessonScheduleDto } from '#academic/modules/lesson-schedules/domain';

export class LessonScheduleService {
  constructor(private repository: LessonScheduleRepository) {}

  async getAll(page: number, limit: number, filters?: { day?: string; classId?: string; teacherId?: string; subjectId?: string }) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, limit, filters),
      this.repository.count(filters),
    ]);
    return { data, total };
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Jadwal pelajaran tidak ditemukan');
    return item;
  }

  async create(data: CreateLessonScheduleDto) {
    const lessonHour = await this.#getLessonHour(data.lessonHourId);
    await this.#validateNoConflicts(data.teacherIds, data.classIds, data.day, lessonHour.startTime, lessonHour.endTime);

    return this.repository.create(data as any);
  }

  async createBulk(data: CreateLessonScheduleDto[]) {
    if (data.length === 0) throw new ValidationError('Data tidak boleh kosong');

    const lessonHours = await Promise.all(
      data.map((d) => this.#getLessonHour(d.lessonHourId)),
    );

    for (let i = 0; i < data.length; i++) {
      const d = data[i]!;
      const lh = lessonHours[i]!;
      await this.#validateNoConflicts(d.teacherIds, d.classIds, d.day, lh.startTime, lh.endTime);
    }

    // Seluruh batch dibuat dalam satu transaksi: jika ada satu item gagal,
    // tidak ada item lain yang ikut tersimpan (mencegah data parsial/duplikat).
    return prisma.$transaction(
      (tx) => this.repository.createManyInTx(tx, data as any),
      { timeout: 15000 },
    );
  }

  async update(id: string, data: UpdateLessonScheduleDto) {
    await this.getById(id);

    const lessonHourId = data.lessonHourId;
    const day = data.day;

    if (lessonHourId || day) {
      const current = await this.repository.findById(id);
      if (!current) throw new NotFoundError('Jadwal pelajaran tidak ditemukan');

      const finalLessonHourId = lessonHourId || current.lessonHourId;
      const finalDay = day || current.day;

      const lessonHour = await this.#getLessonHour(finalLessonHourId);

      const teacherIds = data.teacherIds || current.teachers.filter((t: any) => !t.deletedAt).map((t: any) => t.teacherId);
      const classIds = data.classIds || current.classes.filter((c: any) => !c.deletedAt).map((c: any) => c.classId);

      await this.#validateNoConflicts(teacherIds, classIds, finalDay, lessonHour.startTime, lessonHour.endTime, id);
    }

    return this.repository.update(id, data as any);
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repository.softDelete(id);
  }

  async deleteBulk(ids: string[]) {
    const [, , result] = await this.repository.softDeleteMany(ids);
    return { deleted: result.count };
  }

  async updateStatusBulk(ids: string[], status: string) {
    const { count } = await this.repository.updateStatusMany(ids, status);
    return { updated: count };
  }

  async #getLessonHour(id: string) {
    const lessonHour = await prisma.lessonHour.findFirst({
      where: { id, deletedAt: null },
    });
    if (!lessonHour) throw new NotFoundError('Jam pelajaran tidak ditemukan');
    return lessonHour;
  }

  async #validateNoConflicts(
    teacherIds: string[],
    classIds: string[],
    day: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ) {
    // Cari jam pelajaran yang waktunya overlap dengan range yang diajukan
    const overlappingHours = await prisma.lessonHour.findMany({
      where: {
        deletedAt: null,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlappingHours.length === 0) return;

    const overlappingHourIds = overlappingHours.map((h) => h.id);

    // Cek bentrok dengan event jadwal (event berlaku untuk semua kelas)
    const eventsOnDay = await prisma.scheduleEvent.findMany({
      where: { day, deletedAt: null },
      include: { startHour: true },
    });
    for (const ev of eventsOnDay) {
      const evHours = await prisma.lessonHour.findMany({
        where: {
          deletedAt: null,
          order: { gte: ev.startHour.order, lt: ev.startHour.order + ev.durationHours },
        },
        select: { id: true },
      });
      const evHourIdSet = new Set(evHours.map((h) => h.id));
      if (overlappingHourIds.some((id) => evHourIdSet.has(id))) {
        throw new ValidationError(
          `Tidak dapat menyimpan jadwal: bentrok dengan event "${ev.name}" pada ${day} (event berlaku untuk semua kelas).`,
        );
      }
    }

    const scheduleFilter: any = {
      day,
      deletedAt: null,
      lessonHourId: { in: overlappingHourIds },
    };
    if (excludeId) scheduleFilter.id = { not: excludeId };

    const [teacherConflicts, classConflicts] = await Promise.all([
      prisma.lessonScheduleTeacher.findMany({
        where: {
          teacherId: { in: teacherIds },
          deletedAt: null,
          schedule: scheduleFilter,
        },
        include: {
          schedule: {
            include: {
              lessonHour: true,
              teachers: { where: { deletedAt: null } },
              classes: { where: { deletedAt: null } },
            },
          },
        },
      }),
      prisma.lessonScheduleClass.findMany({
        where: {
          classId: { in: classIds },
          deletedAt: null,
          schedule: scheduleFilter,
        },
        include: {
          schedule: {
            include: {
              lessonHour: true,
              classes: { where: { deletedAt: null } },
            },
          },
        },
      }),
    ]);

    const allSubjectIds = [
      ...new Set([
        ...teacherConflicts.map((tc) => tc.schedule.subjectId),
        ...classConflicts.map((cc) => cc.schedule.subjectId),
      ]),
    ];
    const allTeacherIds = [
      ...new Set([...teacherConflicts.flatMap((tc) => tc.schedule.teachers.filter((t) => !t.deletedAt).map((t) => t.teacherId))]),
    ];
    const allClassIds = [
      ...new Set([
        ...teacherConflicts.flatMap((tc) => tc.schedule.classes.filter((c) => !c.deletedAt).map((c) => c.classId)),
        ...classConflicts.flatMap((cc) => cc.schedule.classes.filter((c) => !c.deletedAt).map((c) => c.classId)),
        ...classConflicts.map((cc) => cc.classId),
      ]),
    ];

    const [masterSubjects, masterTeachers, masterClasses] = await Promise.all([
      allSubjectIds.length ? getOrchestrator().masterSubject.findByIds(allSubjectIds) : [],
      allTeacherIds.length ? getOrchestrator().masterTeacher.findByIds(allTeacherIds) : [],
      allClassIds.length ? getOrchestrator().masterClass.findByIds(allClassIds) : [],
    ]);

    const subjectMap = new Map(masterSubjects.map((s) => [s.id, s]));
    const teacherMap = new Map(masterTeachers.map((t) => [t.id, t]));
    const classMap = new Map(masterClasses.map((c) => [c.id, c]));

    if (teacherConflicts.length > 0 && teacherConflicts[0]) {
      const s = teacherConflicts[0].schedule;
      const subject = subjectMap.get(s.subjectId);
      const teacherName = s.teachers
        .filter((t) => !t.deletedAt)
        .map((t) => teacherMap.get(t.teacherId)?.fullname ?? t.teacherId)
        .join(', ');
      const classNames = s.classes
        .filter((c) => !c.deletedAt)
        .map((c) => classMap.get(c.classId)?.name ?? c.classId)
        .join(', ');
      throw new ValidationError(
        `Guru ${teacherName} sudah mengajar "${subject?.name ?? 'Unknown'}" di kelas ${classNames} pada ${s.day} jam ${s.lessonHour.startTime}-${s.lessonHour.endTime}`,
      );
    }

    if (classConflicts.length > 0 && classConflicts[0]) {
      const c = classConflicts[0];
      const s = c.schedule;
      const subject = subjectMap.get(s.subjectId);
      const classNames = s.classes
        .filter((cl) => !cl.deletedAt)
        .map((cl) => classMap.get(cl.classId)?.name ?? cl.classId)
        .join(', ');
      const thisClass = classMap.get(c.classId);
      throw new ValidationError(
        `Kelas ${thisClass?.name ?? 'Unknown'} sudah memiliki jadwal "${subject?.name ?? 'Unknown'}" pada ${s.day} jam ${s.lessonHour.startTime}-${s.lessonHour.endTime}`,
      );
    }
  }
}

export const lessonSchedulesService = new LessonScheduleService(lessonScheduleRepository);
