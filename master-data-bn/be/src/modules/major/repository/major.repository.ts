import { prisma } from '@/database';
import { CreateMajorDto, UpdateMajorDto } from '@/modules/major/domain';

export class MajorRepository {
  async findAll(skip: number, take: number, includeClasses: boolean = false, includeCurrentStudent: boolean = false) {
    const include: import('@/database/generated/client').Prisma.MajorInclude = {
      ...(includeClasses ? { classes: { where: { deletedAt: null } } } : {}),
      ...(includeCurrentStudent ? { _count: { select: { currentStudents: true } } } : {})
    };
    return prisma.major.findMany({ 
      where: { deletedAt: null }, 
      skip, 
      take,
      include: Object.keys(include).length > 0 ? include : undefined
    });
  }

  async count() {
    return prisma.major.count({ where: { deletedAt: null } });
  }

  async findById(id: string, includeClasses: boolean = false, includeCurrentStudent: boolean = false) {
    const include: import('@/database/generated/client').Prisma.MajorInclude = {
      ...(includeClasses ? { classes: { where: { deletedAt: null } } } : {}),
      ...(includeCurrentStudent ? { _count: { select: { currentStudents: true } } } : {})
    };
    return prisma.major.findFirst({ 
      where: { id, deletedAt: null },
      include: Object.keys(include).length > 0 ? include : undefined
    });
  }

  async findByIds(ids: string[]) {
    return prisma.major.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async checkUnique(field: string, value: string, excludeId?: string) {
    const where: import('@/database/generated/client').Prisma.MajorWhereInput = { [field]: value, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.major.findFirst({ where });
  }

  async create(data: CreateMajorDto) {
    return prisma.major.create({ data, include: { classes: { where: { deletedAt: null } } } });
  }

  async update(id: string, data: UpdateMajorDto) {
    return prisma.major.update({ where: { id }, data, include: { classes: { where: { deletedAt: null } } } });
  }

  async softDelete(id: string) {
    return prisma.major.update({ where: { id }, data: { deletedAt: new Date() }, include: { classes: { where: { deletedAt: null } } } });
  }
}

export const majorRepository = new MajorRepository();
