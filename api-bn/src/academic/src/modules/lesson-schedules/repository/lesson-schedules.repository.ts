import { prisma } from '@academic/database/index.js';
import type { Prisma } from '@academic/database/index.js';
import { getOrchestrator } from '@app/orchestrator.js';
import { putOptionalToNull } from '@app/index.js';

export type LessonScheduleFilters = {
  day?: string;
  classId?: string;
  teacherId?: string;
  subjectId?: string;
};

type LessonScheduleBase = Prisma.LessonScheduleGetPayload<{
  include: {
    lessonHour: true;
    teachers: { where: { deletedAt: null } };
    classes: { where: { deletedAt: null } };
  };
}>;

type HydratedLessonSchedule = Omit<LessonScheduleBase, 'teachers' | 'classes'> & {
  subject: { id: string; code: string; name: string } | null;
  teachers: (Prisma.LessonScheduleTeacherGetPayload<{}> & {
    teacher: { id: string; fullname: string; nip: string | null } | null;
  })[];
  classes: (Prisma.LessonScheduleClassGetPayload<{}> & {
    class: { id: string; name: string; majorId: string } | null;
  })[];
};

async function hydrate(items: LessonScheduleBase[]): Promise<HydratedLessonSchedule[]> {
  if (items.length === 0) return items as any;

  const subjectIds = [...new Set(items.map((i) => i.subjectId))];
  const teacherIds = [...new Set(items.flatMap((i) => i.teachers.filter((t) => !t.deletedAt).map((t) => t.teacherId)))];
  const classIds = [...new Set(items.flatMap((i) => i.classes.filter((c) => !c.deletedAt).map((c) => c.classId)))];

  const [subjects, teachers, classes] = await Promise.all([
    subjectIds.length ? getOrchestrator().masterSubject.findByIds(subjectIds) : Promise.resolve([]),
    teacherIds.length ? getOrchestrator().masterTeacher.findByIds(teacherIds) : Promise.resolve([]),
    classIds.length ? getOrchestrator().masterClass.findByIds(classIds) : Promise.resolve([]),
  ]);

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  return items.map((item) => ({
    ...item,
    subject: subjectMap.get(item.subjectId) ?? null,
    teachers: item.teachers.map((t) => ({
      ...t,
      teacher: teacherMap.get(t.teacherId) ?? null,
    })),
    classes: item.classes.map((c) => ({
      ...c,
      class: classMap.get(c.classId) ?? null,
    })),
  })) as any;
}

const scheduleInclude = {
  lessonHour: true,
  teachers: {
    where: { deletedAt: null },
  },
  classes: {
    where: { deletedAt: null },
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

    const items = await prisma.lessonSchedule.findMany({
      where,
      skip,
      take,
      orderBy: [{ day: 'asc' }, { lessonHour: { order: 'asc' } }],
      include: scheduleInclude,
    });
    return hydrate(items);
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
    const item = await prisma.lessonSchedule.findFirst({
      where: { id, deletedAt: null },
      include: scheduleInclude,
    });
    if (!item) return null;
    return (await hydrate([item]))[0] ?? null;
  }

  async create(data: {
    subjectId: string;
    lessonHourId: string;
    day: string;
    notes?: string | null;
    teacherIds: string[];
    classIds: string[];
  }) {
    const item = await prisma.lessonSchedule.create({
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
    return (await hydrate([item]))[0] ?? null;
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
    const normalized = putOptionalToNull({ ...data }, ['notes']);
    const updateData: Record<string, unknown> = {};
    if (normalized.subjectId !== undefined) updateData.subjectId = normalized.subjectId;
    if (normalized.lessonHourId !== undefined) updateData.lessonHourId = normalized.lessonHourId;
    if (normalized.day !== undefined) updateData.day = normalized.day;
    if (normalized.notes !== undefined) updateData.notes = normalized.notes;

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

    const item = await prisma.lessonSchedule.update({
      where: { id },
      data: updateData as Prisma.LessonScheduleUpdateInput,
      include: scheduleInclude,
    });
    return (await hydrate([item]))[0] ?? null;
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
