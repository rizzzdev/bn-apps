import { prisma } from '#academic/database/index.js';
import type { Prisma } from '#academic/database/index.js';
import type { CreateClassSubjectRequirementDto, UpdateClassSubjectRequirementDto } from '../domain';
import { getOrchestrator } from '#app/orchestrator.js';
import { putOptionalToNull } from '#app';

type HydratedRequirement = Prisma.ClassSubjectRequirementGetPayload<{}> & {
  class: { id: string; name: string; majorId: string } | null;
  subject: { id: string; code: string; name: string } | null;
  teacher: { id: string; fullname: string; nip: string | null; email: string | null } | null;
};

async function hydrate(items: Prisma.ClassSubjectRequirementGetPayload<{}>[]): Promise<HydratedRequirement[]> {
  if (items.length === 0) return items as any;

  const classIds = [...new Set(items.map((i) => i.classId))];
  const subjectIds = [...new Set(items.map((i) => i.subjectId))];
  const teacherIds = [...new Set(items.map((i) => i.teacherId).filter(Boolean))] as string[];

  const [classes, subjects, teachers] = await Promise.all([
    classIds.length ? getOrchestrator().masterClass.findByIds(classIds) : Promise.resolve([]),
    subjectIds.length ? getOrchestrator().masterSubject.findByIds(subjectIds) : Promise.resolve([]),
    teacherIds.length ? getOrchestrator().masterTeacher.findByIds(teacherIds) : Promise.resolve([]),
  ]);

  const classMap = new Map(classes.map((c) => [c.id, c]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  return items.map((item) => ({
    ...item,
    class: classMap.get(item.classId) ?? null,
    subject: subjectMap.get(item.subjectId) ?? null,
    teacher: item.teacherId ? teacherMap.get(item.teacherId) ?? null : null,
  })) as any;
}

export class ClassSubjectRequirementRepository {
  async findAll(filters?: { classId?: string; subjectId?: string; teacherId?: string }, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const where: any = { deletedAt: null };
    if (filters?.classId) where.classId = filters.classId;
    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.teacherId) where.teacherId = filters.teacherId;

    const items = await client.classSubjectRequirement.findMany({
      where,
      orderBy: [{ classId: 'asc' }, { subjectId: 'asc' }],
    });
    return hydrate(items);
  }

  async findById(id: string) {
    const item = await prisma.classSubjectRequirement.findFirst({
      where: { id, deletedAt: null },
    });
    if (!item) return null;
    return (await hydrate([item]))[0] ?? null;
  }

  async upsert(data: CreateClassSubjectRequirementDto, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;

    const existing = await client.classSubjectRequirement.findFirst({
      where: {
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId || null,
        deletedAt: null,
      },
    });

    let item: any;
    if (existing) {
      item = await client.classSubjectRequirement.update({
        where: { id: existing.id },
        data: {
          teacherId: data.teacherId || null,
          weeklyHours: data.weeklyHours,
          maxHoursPerDay: data.maxHoursPerDay,
        },
      });
    } else {
      item = await client.classSubjectRequirement.create({
        data: {
          classId: data.classId,
          subjectId: data.subjectId,
          teacherId: data.teacherId || null,
          weeklyHours: data.weeklyHours,
          maxHoursPerDay: data.maxHoursPerDay,
        },
      });
    }

    return (await hydrate([item]))[0] ?? null;
  }

  async update(id: string, data: UpdateClassSubjectRequirementDto) {
    const normalized = putOptionalToNull({ ...data }, ['teacherId']);
    const item = await prisma.classSubjectRequirement.update({
      where: { id },
      data: {
        ...(normalized.teacherId !== undefined && { teacherId: normalized.teacherId }),
        ...(normalized.weeklyHours !== undefined && { weeklyHours: normalized.weeklyHours }),
        ...(normalized.maxHoursPerDay !== undefined && { maxHoursPerDay: normalized.maxHoursPerDay }),
      },
    });
    return (await hydrate([item]))[0] ?? null;
  }

  async softDelete(id: string) {
    return prisma.classSubjectRequirement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkSoftDelete(ids: string[]) {
    return prisma.classSubjectRequirement.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async clearAll() {
    return prisma.classSubjectRequirement.updateMany({
      where: { deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}

export const classSubjectRequirementRepository = new ClassSubjectRequirementRepository();
