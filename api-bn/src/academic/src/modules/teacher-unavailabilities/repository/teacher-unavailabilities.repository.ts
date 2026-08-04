import { prisma } from '#academic/database/index.js';
import type { CreateTeacherUnavailabilityDto, BulkSetTeacherUnavailabilityDto } from '../domain';
import { getOrchestrator } from '#app/orchestrator.js';

type Base = import('#academic/database/index.js').Prisma.TeacherUnavailabilityGetPayload<{
  include: { lessonHour: true };
}>;

type Hydrated = Base & {
  teacher: { id: string; fullname: string } | null;
};

async function hydrate(items: Base[]): Promise<Hydrated[]> {
  if (items.length === 0) return items as any;
  const teacherIds = [...new Set(items.map((i) => i.teacherId))];
  const teachers = teacherIds.length
    ? await getOrchestrator().masterTeacher.findByIds(teacherIds)
    : [];
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  return items.map((item) => ({
    ...item,
    teacher: teacherMap.get(item.teacherId) ?? null,
  })) as any;
}

export class TeacherUnavailabilityRepository {
  async findAll(teacherId?: string) {
    const where: any = { deletedAt: null };
    if (teacherId) where.teacherId = teacherId;

    const items = await prisma.teacherUnavailability.findMany({
      where,
      include: { lessonHour: true },
      orderBy: [{ day: 'asc' }, { lessonHour: { order: 'asc' } }],
    });
    return hydrate(items);
  }

  async create(data: CreateTeacherUnavailabilityDto) {
    const item = await prisma.teacherUnavailability.create({
      data: {
        teacherId: data.teacherId,
        day: data.day,
        lessonHourId: data.lessonHourId,
        reason: data.reason || null,
      },
      include: { lessonHour: true },
    });
    return (await hydrate([item]))[0] ?? null;
  }

  async bulkSet(data: BulkSetTeacherUnavailabilityDto) {
    const { teacherId, unavailabilities } = data;

    const records = await prisma.$transaction(async (tx) => {
      await tx.teacherUnavailability.updateMany({
        where: { teacherId, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      if (unavailabilities.length === 0) return [];

      return Promise.all(
        unavailabilities.map((u) =>
          tx.teacherUnavailability.create({
            data: {
              teacherId,
              day: u.day,
              lessonHourId: u.lessonHourId,
              reason: u.reason || null,
            },
            include: { lessonHour: true },
          }),
        ),
      );
    });

    return hydrate(records);
  }

  async delete(id: string) {
    return prisma.teacherUnavailability.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkSoftDelete(ids: string[]) {
    return prisma.teacherUnavailability.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}

export const teacherUnavailabilityRepository = new TeacherUnavailabilityRepository();
