import { prisma } from '@/database';
import type { MajorStudentType } from '@/modules/major-students/domain';

export class MajorStudentRepository {
  async findAll(skip: number, take: number) {
    return prisma.majorStudent.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    return prisma.majorStudent.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.majorStudent.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByStudentAndAcademicYear(studentId: string, academicYearId: string) {
    return prisma.majorStudent.findFirst({
      where: { studentId, academicYearId, deletedAt: null },
    });
  }

  async create(data: Omit<MajorStudentType, 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    return prisma.majorStudent.create({ data: data as any });
  }

  async update(id: string, data: Partial<MajorStudentType>) {
    return prisma.majorStudent.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.majorStudent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(ids: string[]) {
    return prisma.majorStudent.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatusMany(ids: string[], status: string) {
    return prisma.majorStudent.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status: status as any },
    });
  }

  async createMany(data: any[]) {
    return prisma.majorStudent.createMany({ data, skipDuplicates: true });
  }
}

export const majorStudentRepository = new MajorStudentRepository();
