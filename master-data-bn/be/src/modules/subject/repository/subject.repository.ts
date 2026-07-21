import { prisma } from '@/database';
import { CreateSubjectDto, UpdateSubjectDto } from '@/modules/subject/domain';

export class SubjectRepository {
  async findAll(skip: number, take: number) {
    return prisma.subject.findMany({ where: { deletedAt: null }, skip, take });
  }

  async count() {
    return prisma.subject.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.subject.findFirst({ where: { id, deletedAt: null } });
  }

  async findByIds(ids: string[]) {
    return prisma.subject.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async checkUnique(field: string, value: string, excludeId?: string) {
    const where: import('@/database/generated/client').Prisma.SubjectWhereInput = { [field]: value, deletedAt: null };
    if (excludeId) where.id = { not: excludeId };
    return prisma.subject.findFirst({ where });
  }

  async create(data: CreateSubjectDto) {
    return prisma.subject.create({ data });
  }

  async update(id: string, data: UpdateSubjectDto) {
    return prisma.subject.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.subject.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const subjectRepository = new SubjectRepository();
