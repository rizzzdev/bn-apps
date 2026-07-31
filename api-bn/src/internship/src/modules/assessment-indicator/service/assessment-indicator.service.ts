import { AssessmentIndicatorRepository, assessmentIndicatorRepository } from '@internship/modules/assessment-indicator/repository/index.js';
import { CreateAssessmentIndicatorDto, UpdateAssessmentIndicatorDto, BulkCreateAssessmentIndicatorDto } from '@internship/modules/assessment-indicator/domain/index.js';
import { NotFoundError, BadRequestError } from '@app/index.js';
import { withCache, clearCachePattern, setCache } from '@app/index.js';
import { prisma } from '@internship/database/index.js';

export class AssessmentIndicatorService {
  constructor(private repository: AssessmentIndicatorRepository) {}

  async getByPlacementId(placementId: string) {
    const cacheKey = `assessment-indicator:placement:${placementId}`;
    return withCache(cacheKey, 600, async () => {
      const items = await this.repository.findByPlacementId(placementId);
      return items;
    });
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Indikator tidak ditemukan');
    return item;
  }

  async create(data: CreateAssessmentIndicatorDto) {
    const placement = await prisma.internshipPlacement.findUnique({ where: { id: data.placementId } });
    if (!placement) throw new NotFoundError('Data penempatan tidak ditemukan');

    const created = await this.repository.create(data);
    await clearCachePattern(`assessment-indicator:placement:${data.placementId}`);
    return created;
  }

  async bulkCreate(data: BulkCreateAssessmentIndicatorDto) {
    const placement = await prisma.internshipPlacement.findUnique({ where: { id: data.placementId } });
    if (!placement) throw new NotFoundError('Data penempatan tidak ditemukan');

    const result = await this.repository.bulkCreate(data.placementId, data.indicators);
    await clearCachePattern(`assessment-indicator:placement:${data.placementId}`);
    return result;
  }

  async update(id: string, data: UpdateAssessmentIndicatorDto) {
    await this.getById(id);
    const updated = await this.repository.update(id, data);
    await clearCachePattern(`assessment-indicator:placement:*`);
    return updated;
  }

  async delete(id: string) {
    const existing = await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern(`assessment-indicator:placement:${existing.placementId}`);
    return deleted;
  }

  async bulkDelete(ids: string[]) {
    const deleted = await this.repository.bulkSoftDelete(ids);
    await clearCachePattern(`assessment-indicator:placement:*`);
    return deleted;
  }
}

export const assessmentIndicatorService = new AssessmentIndicatorService(assessmentIndicatorRepository);
