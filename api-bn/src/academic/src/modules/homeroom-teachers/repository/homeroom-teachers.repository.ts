import { prisma } from '#academic/database/index.js';
import type { HomeroomTeacherType } from '#academic/modules/homeroom-teachers/domain';

export class HomeroomTeacherRepository {
  async findAll(skip: number, take: number, classId?: string, status?: string) {
    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;
    if (status) where.status = status;
    return prisma.homeroomTeacher.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(classId?: string, status?: string) {
    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;
    if (status) where.status = status;
    return prisma.homeroomTeacher.count({ where });
  }

  async findById(id: string) {
    return prisma.homeroomTeacher.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: Omit<HomeroomTeacherType, 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    return prisma.homeroomTeacher.create({ data: data as any });
  }

  async update(id: string, data: Partial<HomeroomTeacherType>) {
    return prisma.homeroomTeacher.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.homeroomTeacher.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(ids: string[]) {
    return prisma.homeroomTeacher.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatusMany(ids: string[], status: string) {
    return prisma.homeroomTeacher.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status: status as any },
    });
  }
}

export const homeroomTeacherRepository = new HomeroomTeacherRepository();
