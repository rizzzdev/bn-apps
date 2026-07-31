import { prisma } from '@master/database/index.js';
import { CreateSemesterDto, UpdateSemesterDto } from '@master/modules/semester/domain';

export class SemesterRepository {
  async findAll(skip: number, take: number, includeAcademicYear: boolean = false) {
    return prisma.semester.findMany({ 
      where: { deletedAt: null }, 
      skip, 
      take,
      include: includeAcademicYear ? { academicYear: true } : undefined
    });
  }

  async count() {
    return prisma.semester.count({ where: { deletedAt: null } });
  }

  async findById(id: string, includeAcademicYear: boolean = false) {
    return prisma.semester.findFirst({ 
      where: { id, deletedAt: null },
      include: includeAcademicYear ? { academicYear: true } : undefined
    });
  }

  async findByIds(ids: string[]) {
    return prisma.semester.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async checkUniqueType(type: import('@master/database/index.js').SemesterType, academicYearId: string, excludeId?: string) {
    const where: import('@master/database/index.js').Prisma.SemesterWhereInput = { type, academicYearId, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.semester.findFirst({ where });
  }

  async checkActiveStatus(excludeId?: string) {
    const where: import('@master/database/index.js').Prisma.SemesterWhereInput = { status: 'Aktif', deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.semester.findFirst({ where });
  }

  async create(data: CreateSemesterDto) {
    return prisma.semester.create({
      data: data as import('@master/database/index.js').Prisma.SemesterUncheckedCreateInput,
      include: { academicYear: true }
    });
  }

  async update(id: string, data: UpdateSemesterDto) {
    return prisma.semester.update({
      where: { id },
      data: data as import('@master/database/index.js').Prisma.SemesterUncheckedCreateInput,
      include: { academicYear: true }
    });
  }

  async softDelete(id: string) {
    return prisma.semester.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { academicYear: true }
    });
  }
}

export const semesterRepository = new SemesterRepository();
