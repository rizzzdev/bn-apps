import { AssessmentScoreRepository, assessmentScoreRepository } from '#internship/modules/assessment-score/repository/index.js';
import { CreateAssessmentScoreDto, BulkSubmitScoreDto } from '#internship/modules/assessment-score/domain/index.js';
import { AssessmentIndicatorRepository, assessmentIndicatorRepository } from '#internship/modules/assessment-indicator/repository/index.js';
import { NotFoundError, BadRequestError } from '#app';
import { withCache, clearCachePattern, putOptionalToNull } from '#app';
import { prisma } from '#internship/database/index.js';
import { activityService } from '#internship/modules/activity/service/index.js';
import { getReviewerName } from '#internship/utils/activity-helper.js';

const ASSESSMENT_SCORE_NULLABLE_UPDATE_FIELDS = ['notes'] as const;

export class AssessmentScoreService {
  constructor(
    private repository: AssessmentScoreRepository,
    private indicatorRepository: AssessmentIndicatorRepository,
  ) {}

  private async logAssessmentSubmitted(placementId: string, assessorType: string, average: number, actorId: string) {
    const placement = await prisma.internshipPlacement.findUnique({
      where: { id: placementId },
      include: { student: true, teacher: true, industryMentor: true, company: true },
    });
    if (!placement) return;

    const role = assessorType === 'teacher' ? 'Guru' : 'Mentor';
    const studentName = placement.student ? placement.student.name : 'Siswa';
    const companyName = placement.company ? placement.company.name : 'Perusahaan';
    const reviewerName = await getReviewerName(actorId);
    const formattedScore = average.toFixed(2);

    await activityService.create({
      actorId,
      description: `${role} ${reviewerName} telah memberikan nilai magang murid ${studentName} di perusahaan ${companyName}: ${formattedScore}.`,
      action: 'ASSESSMENT_SUBMITTED',
      isForAdmin: true,
    });
    await activityService.create({
      actorId,
      description: `Kamu telah memberikan nilai magang untuk murid ${studentName} di perusahaan ${companyName}: ${formattedScore}.`,
      action: 'ASSESSMENT_SUBMITTED',
      isForAdmin: false,
    });
    if (placement.student?.userId) {
      await activityService.create({
        actorId,
        targetId: placement.student.userId,
        description: `${role} ${reviewerName} telah memberikan nilai magang di perusahaan ${companyName}: ${formattedScore}.`,
        action: 'ASSESSMENT_SUBMITTED',
        isForAdmin: false,
      });
    }
  }

  private async checkAndCompletePlacement(placementId: string, actorId?: string) {
    const placement = await prisma.internshipPlacement.findUnique({
      where: { id: placementId },
      include: { student: true, teacher: true, industryMentor: true, company: true },
    });
    if (!placement || placement.status === 'completed') return;

    const indicators = await this.indicatorRepository.findByPlacementId(placementId);
    if (!indicators || indicators.length === 0) return;

    const scores = await this.repository.findByPlacementId(placementId);
    const teacherScores = scores.filter(s => s.assessorType === 'teacher');
    const mentorScores = scores.filter(s => s.assessorType === 'industry_mentor');

    const teacherComplete = teacherScores.length === indicators.length;
    const mentorComplete = mentorScores.length === indicators.length;
    if (!teacherComplete || !mentorComplete) return;

    const teacherAvg = teacherScores.reduce((sum, s) => sum + Number(s.score), 0) / teacherScores.length;
    const mentorAvg = mentorScores.reduce((sum, s) => sum + Number(s.score), 0) / mentorScores.length;
    const totalScore = (teacherAvg + mentorAvg) / 2;
    const formattedScore = totalScore.toFixed(2);

    await prisma.internshipPlacement.update({
      where: { id: placementId },
      data: { status: 'completed' },
    });

    await clearCachePattern(`internship-placement:all:*`);
    await clearCachePattern(`internship-placement:id:${placementId}`);

    if (actorId) {
      const studentName = placement.student ? placement.student.name : 'Siswa';
      const companyName = placement.company ? placement.company.name : 'Perusahaan';
      const adminDescription = `Status magang murid ${studentName} di perusahaan ${companyName} telah selesai dengan nilai akhir ${formattedScore}.`;

      await activityService.create({
        actorId,
        description: adminDescription,
        action: 'PLACEMENT_COMPLETED',
        isForAdmin: true,
      });
      await activityService.create({
        actorId,
        description: adminDescription,
        action: 'PLACEMENT_COMPLETED',
        isForAdmin: false,
      });

      const targets: { userId?: string | null; description: string }[] = [
        { userId: placement.student?.userId, description: `Status magangmu di perusahaan ${companyName} telah selesai dengan nilai akhir ${formattedScore}.` },
        { userId: placement.teacher?.userId, description: adminDescription },
        { userId: placement.industryMentor?.userId, description: adminDescription },
      ];

      for (const target of targets) {
        if (target.userId) {
          await activityService.create({
            actorId,
            targetId: target.userId,
            description: target.description,
            action: 'PLACEMENT_COMPLETED',
            isForAdmin: false,
          });
        }
      }
    }
  }

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

  async create(data: CreateAssessmentScoreDto, actorId?: string) {
    const indicator = await this.indicatorRepository.findById(data.indicatorId);
    if (!indicator) throw new NotFoundError('Indikator tidak ditemukan');

    const existing = await this.repository.findUnique(data.indicatorId, data.assessorType);
    if (existing) {
      throw new BadRequestError('Skor untuk indikator ini sudah ada. Gunakan update.');
    }

    const created = await this.repository.create(data);
    await clearCachePattern(`assessment-score:placement:${indicator.placementId}`);

    if (actorId) {
      await this.logAssessmentSubmitted(indicator.placementId, data.assessorType, Number(data.score), actorId);
    }
    await this.checkAndCompletePlacement(indicator.placementId, actorId);

    return created;
  }

  async upsert(data: CreateAssessmentScoreDto, actorId?: string) {
    const indicator = await this.indicatorRepository.findById(data.indicatorId);
    if (!indicator) throw new NotFoundError('Indikator tidak ditemukan');

    const result = await this.repository.upsert(data.indicatorId, data.assessorType, data);
    await clearCachePattern(`assessment-score:placement:${indicator.placementId}`);

    if (actorId) {
      await this.logAssessmentSubmitted(indicator.placementId, data.assessorType, Number(data.score), actorId);
    }
    await this.checkAndCompletePlacement(indicator.placementId, actorId);

    return result;
  }

  async bulkSubmit(data: BulkSubmitScoreDto, actorId?: string) {
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

    if (actorId) {
      const average = results.reduce((sum, r) => sum + Number(r.score), 0) / results.length;
      await this.logAssessmentSubmitted(data.placementId, data.assessorType, average, actorId);
    }
    await this.checkAndCompletePlacement(data.placementId, actorId);

    return results;
  }

  async update(id: string, data: Partial<CreateAssessmentScoreDto>, actorId?: string) {
    const existing = await this.getById(id);
    const updated = await this.repository.update(id, putOptionalToNull(data, ASSESSMENT_SCORE_NULLABLE_UPDATE_FIELDS));
    await clearCachePattern(`assessment-score:placement:${existing.indicator.placementId}`);
    return updated;
  }

  async delete(id: string, actorId?: string) {
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
