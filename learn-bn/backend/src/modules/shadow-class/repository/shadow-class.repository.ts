import { prisma } from '@/database';
import type { Prisma } from '@/database/generated';

export class ClassRepository {
  async findAll(skip: number, take: number) {
    return prisma.class.findMany({ skip, take });
  }

  async findById(id: string) {
    return prisma.class.findUnique({ where: { id } });
  }

  async upsert(id: string, data: any) {
    // using any for data to bypass strict typing during initial setup
    return prisma.class.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

export const classRepository = new ClassRepository();
