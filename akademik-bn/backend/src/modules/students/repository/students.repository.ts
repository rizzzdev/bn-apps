import { prisma } from '@/database';
import type { StudentType } from '@/modules/students/domain';

export class StudentRepository {
  async findAll(skip: number, take: number, status?: string) {
    return prisma.student.findMany({
      where: { deletedAt: null, ...(status ? { status } : {}) },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(status?: string) {
    return prisma.student.count({ where: { deletedAt: null, ...(status ? { status } : {}) } });
  }

  async findById(id: string) {
    return prisma.student.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async upsert(id: string, data: Partial<StudentType>) {
    return prisma.student.upsert({
      where: { id },
      create: { id, ...data } as any,
      update: data as any,
    });
  }
}

export const studentRepository = new StudentRepository();
