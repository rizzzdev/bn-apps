import { prisma } from '@internship/database/index.js';
import { CreateAssessmentIndicatorDto, UpdateAssessmentIndicatorDto } from '@internship/modules/assessment-indicator/domain/index.js';
import { Prisma } from '@internship/database/index.js';

export class AssessmentIndicatorRepository {
  async findAll(skip: number, take: number, whereClause?: Prisma.AssessmentIndicatorWhereInput) {
    const where: Prisma.AssessmentIndicatorWhereInput = { ...whereClause, deletedAt: null };
    return prisma.assessmentIndicator.findMany({
      where,
      skip,
      take,
      orderBy: { order: 'asc' },
      include: { scores: { where: { deletedAt: null } } },
    });
  }

  async count(whereClause?: Prisma.AssessmentIndicatorWhereInput) {
    const where: Prisma.AssessmentIndicatorWhereInput = { ...whereClause, deletedAt: null };
    return prisma.assessmentIndicator.count({ where });
  }

  async findById(id: string) {
    return prisma.assessmentIndicator.findFirst({
      where: { id, deletedAt: null },
      include: { scores: { where: { deletedAt: null } } },
    });
  }

  async findByPlacementId(placementId: string) {
    return prisma.assessmentIndicator.findMany({
      where: { placementId, deletedAt: null },
      orderBy: { order: 'asc' },
      include: { scores: { where: { deletedAt: null } } },
    });
  }

  async create(data: CreateAssessmentIndicatorDto) {
    return prisma.assessmentIndicator.create({
      data: data as Prisma.AssessmentIndicatorUncheckedCreateInput,
    });
  }

  async bulkCreate(placementId: string, indicators: { description: string; order?: number }[]) {
    return prisma.assessmentIndicator.createMany({
      data: indicators.map((ind, idx) => ({
        placementId,
        description: ind.description,
        order: ind.order ?? idx,
      })),
    });
  }

  async update(id: string, data: UpdateAssessmentIndicatorDto) {
    return prisma.assessmentIndicator.update({
      where: { id },
      data: data as Prisma.AssessmentIndicatorUpdateInput,
    });
  }

  async softDelete(id: string) {
    return prisma.assessmentIndicator.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async bulkSoftDelete(ids: string[]) {
    return prisma.assessmentIndicator.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }
}

export const assessmentIndicatorRepository = new AssessmentIndicatorRepository();
