import { prisma } from '@/database';
import type { Prisma } from '@/database/generated';

export class AcademicYearRepository {
  async findAll(skip: number, take: number) {
    return prisma.academicYear.findMany({ skip, take });
  }

  async findById(id: string) {
    return prisma.academicYear.findUnique({ where: { id } });
  }

  async upsert(id: string, data: any) {
    // using any for data to bypass strict typing during initial setup
    return prisma.academicYear.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

export const academicYearRepository = new AcademicYearRepository();
