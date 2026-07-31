import { AssessmentScoreRepository, assessmentScoreRepository } from '@internship/modules/assessment-score/repository/index.js';
import { CreateAssessmentScoreDto, BulkSubmitScoreDto } from '@internship/modules/assessment-score/domain/index.js';
import { AssessmentIndicatorRepository, assessmentIndicatorRepository } from '@internship/modules/assessment-indicator/repository/index.js';
import { NotFoundError, BadRequestError } from '@app/index.js';
import { withCache, clearCachePattern } from '@app/index.js';
import { prisma } from '@internship/database/index.js';

export class AssessmentScoreService {
  constructor(
    private repository: AssessmentScoreRepository,
    private indicatorRepository: AssessmentIndicatorRepository,
  ) {}

  async getByPlacementId(placementId: string) {
    const cacheKey = `assessment-score:placement:${placementId}`;
    return withCache(cacheKey, 600, async () => {
      const items = await this.repository.findByPlacementId(placementId);
      return items;
    });
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Skor tidak ditemukan');
    return item;
  }

  async create(data: CreateAssessmentScoreDto) {
    const indicator = await this.indicatorRepository.findById(data.indicatorId);
    if (!indicator) throw new NotFoundError('Indikator tidak ditemukan');

    const existing = await this.repository.findUnique(data.indicatorId, data.assessorType);
    if (existing) {
      throw new BadRequestError('Skor untuk indikator ini sudah ada. Gunakan update.');
    }

    const created = await this.repository.create(data);
    await clearCachePattern(`assessment-score:placement:${indicator.placementId}`);
    return created;
  }

  async upsert(data: CreateAssessmentScoreDto) {
    const indicator = await this.indicatorRepository.findById(data.indicatorId);
    if (!indicator) throw new NotFoundError('Indikator tidak ditemukan');

    const result = await this.repository.upsert(data.indicatorId, data.assessorType, data);
    await clearCachePattern(`assessment-score:placement:${indicator.placementId}`);
    return result;
  }

  async bulkSubmit(data: BulkSubmitScoreDto) {
    const indicators = await this.indicatorRepository.findByPlacementId(data.placementId);
    if (!indicators || indicators.length === 0) {
      throw new BadRequestError('Tidak ada indikator untuk penempatan ini');
    }

    const indicatorIds = new Set(indicators.map(i => i.id));
    for (const score of data.scores) {
      if (!indicatorIds.has(score.indicatorId)) {
        throw new BadRequestError(`Indikator ${score.indicatorId} tidak ditemukan di penempatan ini`);
      }
    }

    const results = await this.repository.bulkUpsert(
      data.placementId,
      data.assessorType,
      data.assessorId,
      data.scores,
    );

    await clearCachePattern(`assessment-score:placement:${data.placementId}`);
    await this.recalculateFinalScore(data.placementId, data.assessorType);

    return results;
  }

  async update(id: string, data: Partial<CreateAssessmentScoreDto>) {
    const existing = await this.getById(id);
    const updated = await this.repository.update(id, data);
    await clearCachePattern(`assessment-score:placement:${existing.indicator.placementId}`);
    return updated;
  }

  async delete(id: string) {
    const existing = await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern(`assessment-score:placement:${existing.indicator.placementId}`);
    return deleted;
  }

  async recalculateFinalScore(placementId: string, assessorType?: string) {
    const scores = await this.repository.findByPlacementId(placementId);

    const teacherScores = scores.filter(s => s.assessorType === 'teacher');
    const mentorScores = scores.filter(s => s.assessorType === 'industry_mentor');

    const teacherAvg = teacherScores.length > 0
      ? teacherScores.reduce((sum, s) => sum + Number(s.score), 0) / teacherScores.length
      : null;

    const mentorAvg = mentorScores.length > 0
      ? mentorScores.reduce((sum, s) => sum + Number(s.score), 0) / mentorScores.length
      : null;

    const roundedTeacherAvg = teacherAvg !== null ? Math.round(teacherAvg * 100) / 100 : null;
    const roundedMentorAvg = mentorAvg !== null ? Math.round(mentorAvg * 100) / 100 : null;

    // Only update the relevant assessor type if specified
    if (!assessorType || assessorType === 'teacher') {
      if (roundedTeacherAvg !== null) {
        await prisma.assessment.upsert({
          where: { placementId_assessorType: { placementId, assessorType: 'teacher' } },
          update: {
            finalScore: roundedTeacherAvg,
            teacherScore: roundedTeacherAvg,
            mentorScore: roundedMentorAvg,
          },
          create: {
            placementId,
            assessorType: 'teacher',
            finalScore: roundedTeacherAvg,
            teacherScore: roundedTeacherAvg,
            mentorScore: roundedMentorAvg,
          },
        });
      }
    }

    if (!assessorType || assessorType === 'industry_mentor') {
      if (roundedMentorAvg !== null) {
        await prisma.assessment.upsert({
          where: { placementId_assessorType: { placementId, assessorType: 'industry_mentor' } },
          update: {
            finalScore: roundedMentorAvg,
            teacherScore: roundedTeacherAvg,
            mentorScore: roundedMentorAvg,
          },
          create: {
            placementId,
            assessorType: 'industry_mentor',
            finalScore: roundedMentorAvg,
            teacherScore: roundedTeacherAvg,
            mentorScore: roundedMentorAvg,
          },
        });
      }
    }
  }
}

export const assessmentScoreService = new AssessmentScoreService(assessmentScoreRepository, assessmentIndicatorRepository);
