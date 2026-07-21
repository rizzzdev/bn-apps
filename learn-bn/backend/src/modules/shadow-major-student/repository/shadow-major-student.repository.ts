import { prisma } from '@/database';
import type { Prisma } from '@/database/generated';

export class MajorStudentRepository {
  async findAll(skip: number, take: number) {
    return prisma.majorStudent.findMany({ skip, take });
  }

  async findById(id: string) {
    return prisma.majorStudent.findUnique({ where: { id } });
  }

  async upsert(id: string, data: any) {
    // using any for data to bypass strict typing during initial setup
    return prisma.majorStudent.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

export const majorStudentRepository = new MajorStudentRepository();
