import { prisma } from '@/database';
import { CreateClassDto, UpdateClassDto } from '@/modules/class/domain';

export class ClassRepository {
  async findAll(skip: number, take: number, includeMajor: boolean = false, includeCurrentStudent: boolean = false) {
    const include: import('@/database/generated/client').Prisma.ClassInclude = {
      ...(includeMajor ? { major: true } : {}),
      ...(includeCurrentStudent ? { _count: { select: { currentStudents: true } } } : {})
    };
    return prisma.class.findMany({ where: { deletedAt: null }, skip, take, include: Object.keys(include).length > 0 ? include : undefined });
  }

  async count() {
    return prisma.class.count({ where: { deletedAt: null } });
  }

  async findById(id: string, includeMajor: boolean = false, includeCurrentStudent: boolean = false) {
    const include: import('@/database/generated/client').Prisma.ClassInclude = {
      ...(includeMajor ? { major: true } : {}),
      ...(includeCurrentStudent ? { _count: { select: { currentStudents: true } } } : {})
    };
    return prisma.class.findFirst({ where: { id, deletedAt: null }, include: Object.keys(include).length > 0 ? include : undefined });
  }

  async findByIds(ids: string[]) {
    return prisma.class.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async checkUnique(field: string, value: string, excludeId?: string) {
    const where: import('@/database/generated/client').Prisma.ClassWhereInput = { [field]: value, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.class.findFirst({ where });
  }

  async create(data: CreateClassDto) {
    return prisma.class.create({ data, include: { major: true } });
  }

  async update(id: string, data: UpdateClassDto) {
    return prisma.class.update({ where: { id }, data, include: { major: true } });
  }

  async softDelete(id: string) {
    return prisma.class.update({ where: { id }, data: { deletedAt: new Date() }, include: { major: true } });
  }
}

export const classRepository = new ClassRepository();
