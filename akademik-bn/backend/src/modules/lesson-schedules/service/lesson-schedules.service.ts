import { prisma } from '@/database';
import { lessonScheduleRepository } from '@/modules/lesson-schedules/repository';
import type { LessonScheduleRepository } from '@/modules/lesson-schedules/repository/lesson-schedules.repository';
import { NotFoundError, ValidationError } from '@/errors';
import type { CreateLessonScheduleDto, UpdateLessonScheduleDto } from '@/modules/lesson-schedules/domain';

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

    const results = await Promise.all(
      data.map((d) => this.repository.create(d as any)),
    );

    return results;
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

    const scheduleFilter: any = {
      day,
      deletedAt: null,
      lessonHourId: { in: overlappingHourIds },
    };
    if (excludeId) scheduleFilter.id = { not: excludeId };

    // Cek bentrok guru
    const teacherConflicts = await prisma.lessonScheduleTeacher.findMany({
      where: {
        teacherId: { in: teacherIds },
        deletedAt: null,
        schedule: scheduleFilter,
      },
      include: {
        schedule: {
          include: {
            subject: true,
            lessonHour: true,
            classes: { where: { deletedAt: null }, include: { class: true } },
            teachers: { where: { deletedAt: null }, include: { teacher: true } },
          },
        },
      },
    });

    if (teacherConflicts.length > 0 && teacherConflicts[0]) {
      const s = teacherConflicts[0].schedule;
      const teacherName = s.teachers.map((t) => t.teacher.fullname).join(', ');
      const classNames = s.classes.map((c) => c.class.name).join(', ');
      throw new ValidationError(
        `Guru ${teacherName} sudah mengajar "${s.subject.name}" di kelas ${classNames} pada ${s.day} jam ${s.lessonHour.startTime}-${s.lessonHour.endTime}`,
      );
    }

    // Cek bentrok kelas
    const classConflicts = await prisma.lessonScheduleClass.findMany({
      where: {
        classId: { in: classIds },
        deletedAt: null,
        schedule: scheduleFilter,
      },
      include: {
        class: true,
        schedule: {
          include: {
            subject: true,
            lessonHour: true,
            classes: { where: { deletedAt: null }, include: { class: true } },
          },
        },
      },
    });

    if (classConflicts.length > 0 && classConflicts[0]) {
      const c = classConflicts[0];
      const s = c.schedule;
      const classNames = s.classes.map((cl) => cl.class.name).join(', ');
      throw new ValidationError(
        `Kelas ${c.class.name} sudah memiliki jadwal "${s.subject.name}" pada ${s.day} jam ${s.lessonHour.startTime}-${s.lessonHour.endTime}`,
      );
    }
  }
}

export const lessonSchedulesService = new LessonScheduleService(lessonScheduleRepository);
