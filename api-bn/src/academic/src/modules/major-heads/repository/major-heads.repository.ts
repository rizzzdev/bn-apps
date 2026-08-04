import { prisma } from '#academic/database/index.js';
import type { MajorHeadType } from '#academic/modules/major-heads/domain';

export class MajorHeadRepository {
  async findAll(skip: number, take: number, filters?: { majorId?: string | undefined; academicYearId?: string | undefined; status?: string | undefined }) {
    return prisma.majorHead.findMany({
      where: {
        deletedAt: null,
        ...(filters?.majorId ? { majorId: filters.majorId } : {}),
        ...(filters?.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        ...(filters?.status ? { status: filters.status as any } : {}),
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(filters?: { majorId?: string | undefined; academicYearId?: string | undefined; status?: string | undefined }) {
    return prisma.majorHead.count({
      where: {
        deletedAt: null,
        ...(filters?.majorId ? { majorId: filters.majorId } : {}),
        ...(filters?.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        ...(filters?.status ? { status: filters.status as any } : {}),
      },
    });
  }

  async findById(id: string) {
    return prisma.majorHead.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: Omit<MajorHeadType, 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    return prisma.majorHead.create({ data: data as any });
  }

  async update(id: string, data: Partial<MajorHeadType>) {
    return prisma.majorHead.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.majorHead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(ids: string[]) {
    return prisma.majorHead.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatusMany(ids: string[], status: string) {
    return prisma.majorHead.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status: status as any },
    });
  }
}

export const majorHeadRepository = new MajorHeadRepository();
