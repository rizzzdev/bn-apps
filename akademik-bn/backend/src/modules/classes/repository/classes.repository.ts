import { prisma } from '@/database';
import type { ClassType } from '@/modules/classes/domain';

export class ClassRepository {
  async findAll(skip: number, take: number) {
    return prisma.class.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    return prisma.class.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.class.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async upsert(id: string, data: Partial<ClassType>) {
    return prisma.class.upsert({
      where: { id },
      create: { id, ...data } as any,
      update: data as any,
    });
  }
}

export const classRepository = new ClassRepository();
