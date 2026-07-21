import { prisma } from '@/database';
import type { Prisma } from '@/database/generated/client';

export type LessonScheduleFilters = {
  day?: string;
  classId?: string;
  teacherId?: string;
  subjectId?: string;
};

const scheduleInclude = {
  subject: true,
  lessonHour: true,
  teachers: {
    where: { deletedAt: null },
    include: { teacher: true },
  },
  classes: {
    where: { deletedAt: null },
    include: { class: true },
  },
} satisfies Prisma.LessonScheduleInclude;

export class LessonScheduleRepository {
  async findAll(skip: number, take: number, filters?: LessonScheduleFilters) {
    const where: Prisma.LessonScheduleWhereInput = { deletedAt: null };
    if (filters?.day) where.day = filters.day;
    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.classId) {
      where.classes = { some: { classId: filters.classId, deletedAt: null } };
    }
    if (filters?.teacherId) {
      where.teachers = { some: { teacherId: filters.teacherId, deletedAt: null } };
    }

    return prisma.lessonSchedule.findMany({
      where,
      skip,
      take,
      orderBy: [{ day: 'asc' }, { lessonHour: { order: 'asc' } }],
      include: scheduleInclude,
    });
  }

  async count(filters?: LessonScheduleFilters) {
    const where: Prisma.LessonScheduleWhereInput = { deletedAt: null };
    if (filters?.day) where.day = filters.day;
    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.classId) {
      where.classes = { some: { classId: filters.classId, deletedAt: null } };
    }
    if (filters?.teacherId) {
      where.teachers = { some: { teacherId: filters.teacherId, deletedAt: null } };
    }

    return prisma.lessonSchedule.count({ where });
  }

  async findById(id: string) {
    return prisma.lessonSchedule.findFirst({
      where: { id, deletedAt: null },
      include: scheduleInclude,
    });
  }

  async create(data: {
    subjectId: string;
    lessonHourId: string;
    day: string;
    notes?: string | null;
    teacherIds: string[];
    classIds: string[];
  }) {
    return prisma.lessonSchedule.create({
      data: {
        subjectId: data.subjectId,
        lessonHourId: data.lessonHourId,
        day: data.day,
        notes: data.notes ?? null,
        teachers: {
          create: data.teacherIds.map((teacherId) => ({ teacherId })),
        },
        classes: {
          create: data.classIds.map((classId) => ({ classId })),
        },
      },
      include: scheduleInclude,
    });
  }

  async update(
    id: string,
    data: {
      subjectId?: string;
      lessonHourId?: string;
      day?: string;
      notes?: string | null;
      teacherIds?: string[];
      classIds?: string[];
    },
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;
    if (data.lessonHourId !== undefined) updateData.lessonHourId = data.lessonHourId;
    if (data.day !== undefined) updateData.day = data.day;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.teacherIds) {
      await prisma.lessonScheduleTeacher.updateMany({
        where: { scheduleId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await prisma.lessonScheduleTeacher.createMany({
        data: data.teacherIds.map((teacherId) => ({ scheduleId: id, teacherId })),
      });
    }

    if (data.classIds) {
      await prisma.lessonScheduleClass.updateMany({
        where: { scheduleId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await prisma.lessonScheduleClass.createMany({
        data: data.classIds.map((classId) => ({ scheduleId: id, classId })),
      });
    }

    return prisma.lessonSchedule.update({
      where: { id },
      data: updateData as Prisma.LessonScheduleUpdateInput,
      include: scheduleInclude,
    });
  }

  async softDelete(id: string) {
    return prisma.$transaction([
      prisma.lessonScheduleTeacher.updateMany({
        where: { scheduleId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      prisma.lessonScheduleClass.updateMany({
        where: { scheduleId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      prisma.lessonSchedule.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  async softDeleteMany(ids: string[]) {
    return prisma.$transaction([
      prisma.lessonScheduleTeacher.updateMany({
        where: { scheduleId: { in: ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      prisma.lessonScheduleClass.updateMany({
        where: { scheduleId: { in: ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      prisma.lessonSchedule.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  async updateStatusMany(ids: string[], status: string) {
    return prisma.lessonSchedule.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status: status as any },
    });
  }
}

export const lessonScheduleRepository = new LessonScheduleRepository();
