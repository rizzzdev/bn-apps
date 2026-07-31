import { prisma } from '@internship/database/index.js';
import { CreateAssessmentDto, UpdateAssessmentDto } from '@internship/modules/assessment/domain/index.js';
import { Prisma } from '@internship/database/index.js';

export class AssessmentRepository {
  async findAll(skip: number, take: number, whereClause?: Prisma.AssessmentWhereInput) {
    const where: Prisma.AssessmentWhereInput = { ...whereClause, deletedAt: null };
    return prisma.assessment.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } });
  }

  async count(whereClause?: Prisma.AssessmentWhereInput) {
    const where: Prisma.AssessmentWhereInput = { ...whereClause, deletedAt: null };
    return prisma.assessment.count({ where });
  }

  async findById(id: string) {
    return prisma.assessment.findFirst({ where: { id, deletedAt: null } });
  }

  async create(data: CreateAssessmentDto) {
    return prisma.assessment.create({ data: data as Prisma.AssessmentUncheckedCreateInput });
  }

  async update(id: string, data: UpdateAssessmentDto) {
    return prisma.assessment.update({ where: { id }, data: data as Prisma.AssessmentUpdateInput });
  }

  async softDelete(id: string) {
    return prisma.assessment.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  async bulkSoftDelete(ids: string[]) {
    return prisma.assessment.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  }
}

export const assessmentRepository = new AssessmentRepository();
