import { prisma } from '#internship/database/index.js';
import { Prisma } from '#internship/database/index.js';
import { CreateAssessmentScoreDto } from '#internship/modules/assessment-score/domain/index.js';

export class AssessmentScoreRepository {
  async findByPlacementId(placementId: string) {
    return prisma.assessmentScore.findMany({
      where: {
        deletedAt: null,
        indicator: { placementId, deletedAt: null },
      },
      include: { indicator: true },
      orderBy: { indicator: { order: 'asc' } },
    });
  }

  async findByIndicatorId(indicatorId: string) {
    return prisma.assessmentScore.findMany({
      where: { indicatorId, deletedAt: null },
    });
  }

  async findById(id: string) {
    return prisma.assessmentScore.findFirst({
      where: { id, deletedAt: null },
      include: { indicator: true },
    });
  }

  async findUnique(indicatorId: string, assessorType: string) {
    return prisma.assessmentScore.findFirst({
      where: { indicatorId, assessorType: assessorType as any, deletedAt: null },
    });
  }

  async create(data: CreateAssessmentScoreDto) {
    return prisma.assessmentScore.create({ data: data as any });
  }

  async upsert(indicatorId: string, assessorType: string, data: CreateAssessmentScoreDto) {
    const existing = await this.findUnique(indicatorId, assessorType);
    if (existing) {
      return prisma.assessmentScore.update({
        where: { id: existing.id },
        data: { score: data.score, notes: data.notes },
      });
    }
    return prisma.assessmentScore.create({ data: data as any });
  }

  async bulkUpsert(placementId: string, assessorType: string, assessorId: string, scores: { indicatorId: string; score: number; notes?: string }[]) {
    const results = [];
    for (const item of scores) {
      const result = await this.upsert(item.indicatorId, assessorType, {
        indicatorId: item.indicatorId,
        assessorType: assessorType as any,
        assessorId,
        score: item.score,
        notes: item.notes,
      });
      results.push(result);
    }
    return results;
  }

  async update(id: string, data: Partial<CreateAssessmentScoreDto>) {
    return prisma.assessmentScore.update({
      where: { id },
      data: data as any,
    });
  }

  async softDelete(id: string) {
    return prisma.assessmentScore.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const assessmentScoreRepository = new AssessmentScoreRepository();
