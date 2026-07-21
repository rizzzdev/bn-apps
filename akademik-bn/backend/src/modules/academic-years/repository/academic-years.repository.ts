import { prisma } from '@/database';
import type { AcademicYearType, WebhookAcademicYearDto } from '@/modules/academic-years/domain';

export class AcademicYearRepository {
  async findAll(skip: number, take: number) {
    return prisma.academicYear.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    return prisma.academicYear.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.academicYear.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findActive() {
    return prisma.academicYear.findFirst({
      where: { status: 'Aktif', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsert(id: string, data: Partial<AcademicYearType>) {
    return prisma.academicYear.upsert({
      where: { id },
      create: { id, ...data } as any,
      update: data as any,
    });
  }

  async deactivateOldActive(excludeId: string) {
    return prisma.academicYear.updateMany({
      where: { deletedAt: null, id: { not: excludeId } },
      data: { deletedAt: new Date() },
    });
  }
}

export const academicYearRepository = new AcademicYearRepository();
