import { prisma } from '@/database';
import type { SubjectTeacherType } from '@/modules/subject-teachers/domain';

export class SubjectTeacherRepository {
  async findAll(skip: number, take: number, subjectId?: string, status?: string) {
    const where: any = { deletedAt: null };
    if (subjectId) where.subjectId = subjectId;
    if (status) where.status = status;
    return prisma.subjectTeacher.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(subjectId?: string, status?: string) {
    const where: any = { deletedAt: null };
    if (subjectId) where.subjectId = subjectId;
    if (status) where.status = status;
    return prisma.subjectTeacher.count({ where });
  }

  async findById(id: string) {
    return prisma.subjectTeacher.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: Omit<SubjectTeacherType, 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    return prisma.subjectTeacher.create({ data: data as any });
  }

  async update(id: string, data: Partial<SubjectTeacherType>) {
    return prisma.subjectTeacher.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.subjectTeacher.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(ids: string[]) {
    return prisma.subjectTeacher.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatusMany(ids: string[], status: string) {
    return prisma.subjectTeacher.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status: status as any },
    });
  }
}

export const subjectTeacherRepository = new SubjectTeacherRepository();
