import { prisma } from '@internship/database/index.js';
import { Prisma } from '@internship/database/index.js';

export class TeacherRepository {
  async findAll(skip: number, take: number, whereClause?: Prisma.TeacherWhereInput) {
    const where: Prisma.TeacherWhereInput = { ...whereClause, deletedAt: null };
    return prisma.teacher.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  async count(whereClause?: Prisma.TeacherWhereInput) {
    const where: Prisma.TeacherWhereInput = { ...whereClause, deletedAt: null };
    return prisma.teacher.count({ where });
  }

  async findById(id: string) {
    return prisma.teacher.findFirst({ where: { id, deletedAt: null } });
  }

}

export const teacherRepository = new TeacherRepository();
