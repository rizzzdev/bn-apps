import { prisma } from '@/database';
import type { SubjectType } from '@/modules/subjects/domain';

export class SubjectRepository {
  async findAll(skip: number, take: number) {
    return prisma.subject.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    return prisma.subject.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.subject.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async upsert(id: string, data: Partial<SubjectType>) {
    return prisma.subject.upsert({
      where: { id },
      create: { id, ...data } as any,
      update: data as any,
    });
  }
}

export const subjectRepository = new SubjectRepository();
