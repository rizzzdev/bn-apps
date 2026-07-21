import { prisma } from '@/database';
import type { Prisma } from '@/database/generated';

export class SubjectRepository {
  async findAll(skip: number, take: number) {
    return prisma.subject.findMany({ skip, take });
  }

  async findById(id: string) {
    return prisma.subject.findUnique({ where: { id } });
  }

  async upsert(id: string, data: any) {
    // using any for data to bypass strict typing during initial setup
    return prisma.subject.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

export const subjectRepository = new SubjectRepository();
