import { prisma } from '@/database';
import type { Prisma } from '@/database/generated';

export class StudentRepository {
  async findAll(skip: number, take: number) {
    return prisma.student.findMany({ skip, take });
  }

  async findById(id: string) {
    return prisma.student.findUnique({ where: { id } });
  }

  async upsert(id: string, data: any) {
    // using any for data to bypass strict typing during initial setup
    return prisma.student.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

export const studentRepository = new StudentRepository();
