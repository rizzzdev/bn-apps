import { prisma } from '@/database';
import type { ClassStudentType } from '@/modules/class-students/domain';

export class ClassStudentRepository {
  async findAll(skip: number, take: number) {
    return prisma.classStudent.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    return prisma.classStudent.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.classStudent.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findActiveByStudentId(studentId: string) {
    return prisma.classStudent.findFirst({
      where: { studentId, status: 'Aktif', deletedAt: null },
    });
  }

  async findByStudentAndAcademicYear(studentId: string, academicYearId: string) {
    return prisma.classStudent.findFirst({
      where: { studentId, academicYearId, deletedAt: null },
    });
  }

  async create(data: Omit<ClassStudentType, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    return prisma.classStudent.create({ data: data as any });
  }

  async update(id: string, data: Partial<ClassStudentType>) {
    return prisma.classStudent.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.classStudent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(ids: string[]) {
    return prisma.classStudent.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatusMany(ids: string[], status: string) {
    return prisma.classStudent.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status: status as any },
    });
  }

  async createMany(data: any[]) {
    return prisma.classStudent.createMany({ data, skipDuplicates: true });
  }
}

export const classStudentRepository = new ClassStudentRepository();
