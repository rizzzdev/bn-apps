import { prisma } from '@/database';
import type { MajorType } from '@/modules/majors/domain';

export class MajorRepository {
  async findAll(skip: number, take: number) {
    return prisma.major.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    return prisma.major.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.major.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async upsert(id: string, data: Partial<MajorType>) {
    return prisma.major.upsert({
      where: { id },
      create: { id, ...data } as any,
      update: data as any,
    });
  }
}

export const majorRepository = new MajorRepository();
