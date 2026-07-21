import { prisma } from '@/database';
import type { TeacherType } from '@/modules/teachers/domain';

export class TeacherRepository {
  async findAll(skip: number, take: number, status?: string) {
    return prisma.teacher.findMany({
      where: { deletedAt: null, ...(status ? { status } : {}) },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(status?: string) {
    return prisma.teacher.count({ where: { deletedAt: null, ...(status ? { status } : {}) } });
  }

  async findById(id: string) {
    return prisma.teacher.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async upsert(id: string, data: Partial<TeacherType>) {
    return prisma.teacher.upsert({
      where: { id },
      create: { id, ...data } as any,
      update: data as any,
    });
  }
}

export const teacherRepository = new TeacherRepository();
