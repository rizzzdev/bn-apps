import { prisma } from '#internship/database/index.js';
import { Prisma } from '#internship/database/index.js';

export class StudentRepository {
  async findAll(skip: number, take: number, whereClause?: Prisma.StudentWhereInput) {
    const where: Prisma.StudentWhereInput = { ...whereClause, deletedAt: null };
    return prisma.student.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  async count(whereClause?: Prisma.StudentWhereInput) {
    const where: Prisma.StudentWhereInput = { ...whereClause, deletedAt: null };
    return prisma.student.count({ where });
  }

  async findById(id: string) {
    return prisma.student.findFirst({ where: { id, deletedAt: null } });
  }

}

export const studentRepository = new StudentRepository();
