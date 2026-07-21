import { prisma } from '@/database';
import type { Prisma } from '@/database/generated';

export class SubjectTeacherRepository {
  async findAll(skip: number, take: number) {
    return prisma.subjectTeacher.findMany({ skip, take });
  }

  async findById(id: string) {
    return prisma.subjectTeacher.findUnique({ where: { id } });
  }

  async upsert(id: string, data: any) {
    // using any for data to bypass strict typing during initial setup
    return prisma.subjectTeacher.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

export const subjectTeacherRepository = new SubjectTeacherRepository();
