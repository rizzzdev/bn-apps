import { prisma } from '@master/database/index.js';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from '@master/modules/academic-year/domain';

export class AcademicYearRepository {
  async findAll(skip: number, take: number, includeSemesters: boolean = false) {
    return prisma.academicYear.findMany({ 
      where: { deletedAt: null }, 
      skip, 
      take,
      include: includeSemesters ? { semesters: { where: { deletedAt: null } } } : undefined
    });
  }

  async count() {
    return prisma.academicYear.count({ where: { deletedAt: null } });
  }

  async findById(id: string, includeSemesters: boolean = false) {
    return prisma.academicYear.findFirst({ 
      where: { id, deletedAt: null },
      include: includeSemesters ? { semesters: { where: { deletedAt: null } } } : undefined
    });
  }

  async findByIds(ids: string[]) {
    return prisma.academicYear.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async checkUnique(field: string, value: string, excludeId?: string) {
    const where: Record<string, unknown> = { [field]: value, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.academicYear.findFirst({ where });
  }

  async checkActiveStatus(excludeId?: string) {
    const where: Record<string, unknown> = { status: 'Aktif', deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.academicYear.findFirst({ where });
  }

  async create(data: CreateAcademicYearDto) {
    return prisma.academicYear.create({
      data: data as any,
      include: { semesters: { where: { deletedAt: null } } }
    });
  }

  async update(id: string, data: UpdateAcademicYearDto) {
    return prisma.academicYear.update({
      where: { id },
      data: data as any,
      include: { semesters: { where: { deletedAt: null } } }
    });
  }

  async softDelete(id: string) {
    return prisma.academicYear.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { semesters: { where: { deletedAt: null } } }
    });
  }
}

export const academicyearRepository = new AcademicYearRepository();
