import { prisma } from '@/database';
import type { Prisma } from '@/database/generated';

export class ClassStudentRepository {
  async findAll(skip: number, take: number) {
    return prisma.classStudent.findMany({ skip, take });
  }

  async findById(id: string) {
    return prisma.classStudent.findUnique({ where: { id } });
  }

  async upsert(id: string, data: any) {
    // using any for data to bypass strict typing during initial setup
    return prisma.classStudent.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

export const classStudentRepository = new ClassStudentRepository();
