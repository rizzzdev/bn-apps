import { prisma } from '@/database';
import type { Prisma } from '@/database/generated';

export class MajorRepository {
  async findAll(skip: number, take: number) {
    return prisma.major.findMany({ skip, take });
  }

  async findById(id: string) {
    return prisma.major.findUnique({ where: { id } });
  }

  async upsert(id: string, data: any) {
    // using any for data to bypass strict typing during initial setup
    return prisma.major.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

export const majorRepository = new MajorRepository();
