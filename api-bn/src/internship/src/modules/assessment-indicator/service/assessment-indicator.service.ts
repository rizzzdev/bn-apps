import { AssessmentIndicatorRepository, assessmentIndicatorRepository } from '@internship/modules/assessment-indicator/repository/index.js';
import { CreateAssessmentIndicatorDto, UpdateAssessmentIndicatorDto, BulkCreateAssessmentIndicatorDto } from '@internship/modules/assessment-indicator/domain/index.js';
import { NotFoundError, BadRequestError } from '@app/index.js';
import { withCache, clearCachePattern, setCache } from '@app/index.js';
import { prisma } from '@internship/database/index.js';
import { activityService } from '@internship/modules/activity/service/index.js';
import { getAdminName } from '@internship/utils/activity-helper.js';

export class AssessmentIndicatorService {
  constructor(private repository: AssessmentIndicatorRepository) {}

  private async logIndicatorActivity(
    placementId: string,
    actorId: string,
    action: string,
    adminDescription: string,
    userDescription: string,
    extraReplacements?: Record<string, string>,
  ) {
    const placement = await prisma.internshipPlacement.findUnique({
      where: { id: placementId },
      include: { student: true, teacher: true, industryMentor: true, company: true },
    });
    if (!placement) return;

    const adminName = await getAdminName(actorId);
    const studentName = placement.student ? placement.student.name : 'Siswa';
    const companyName = placement.company ? placement.company.name : 'Perusahaan';

    const applyReplacements = (text: string) =>
      text
        .replace('{admin}', adminName)
        .replace('{student}', studentName)
        .replace('{company}', companyName)
        .replace(/\{count\}/g, extraReplacements?.count || 'beberapa');

    await activityService.create({
      actorId,
      description: applyReplacements(adminDescription),
      action,
      isForAdmin: true,
    });

    const targets: { userId?: string | null; description: string }[] = [
      { userId: placement.student?.userId, description: userDescription },
      { userId: placement.teacher?.userId, description: userDescription },
      { userId: placement.industryMentor?.userId, description: userDescription },
    ];

    for (const target of targets) {
      if (target.userId) {
        await activityService.create({
          actorId,
          targetId: target.userId,
          description: applyReplacements(target.description),
          action,
          isForAdmin: false,
        });
      }
    }
  }

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

  async create(data: CreateAssessmentIndicatorDto, actorId?: string) {
    const placement = await prisma.internshipPlacement.findUnique({ where: { id: data.placementId } });
    if (!placement) throw new NotFoundError('Data penempatan tidak ditemukan');

    const created = await this.repository.create(data);
    await clearCachePattern(`assessment-indicator:placement:${data.placementId}`);

    if (actorId) {
      await this.logIndicatorActivity(
        data.placementId,
        actorId,
        'INDICATOR_CREATED',
        '{admin} menambahkan indikator penilaian untuk murid {student} di {company}.',
        'Admin menambahkan indikator penilaian untuk penempatan magangmu di {company}.',
      );
    }

    return created;
  }

  async bulkCreate(data: BulkCreateAssessmentIndicatorDto, actorId?: string) {
    const placement = await prisma.internshipPlacement.findUnique({ where: { id: data.placementId } });
    if (!placement) throw new NotFoundError('Data penempatan tidak ditemukan');

    const result = await this.repository.bulkCreate(data.placementId, data.indicators);
    await clearCachePattern(`assessment-indicator:placement:${data.placementId}`);

    if (actorId && data.indicators.length > 0) {
      await this.logIndicatorActivity(
        data.placementId,
        actorId,
        'INDICATOR_CREATED',
        '{admin} menambahkan {count} indikator penilaian untuk murid {student} di {company}.',
        'Admin menambahkan indikator penilaian untuk penempatan magangmu di {company}.',
        { count: String(data.indicators.length) },
      );
    }

    return result;
  }

  async update(id: string, data: UpdateAssessmentIndicatorDto, actorId?: string) {
    const existing = await this.getById(id);
    const updated = await this.repository.update(id, data);
    await clearCachePattern(`assessment-indicator:placement:*`);

    if (actorId) {
      await this.logIndicatorActivity(
        existing.placementId,
        actorId,
        'INDICATOR_UPDATED',
        '{admin} memperbarui indikator penilaian untuk murid {student} di {company}.',
        'Admin memperbarui indikator penilaian untuk penempatan magangmu di {company}.',
      );
    }

    return updated;
  }

  async delete(id: string, actorId?: string) {
    const existing = await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern(`assessment-indicator:placement:${existing.placementId}`);

    if (actorId) {
      await this.logIndicatorActivity(
        existing.placementId,
        actorId,
        'INDICATOR_DELETED',
        '{admin} menghapus indikator penilaian untuk murid {student} di {company}.',
        'Admin menghapus indikator penilaian untuk penempatan magangmu di {company}.',
      );
    }

    return deleted;
  }

  async bulkDelete(ids: string[], actorId?: string) {
    const indicators = await this.repository.findByIds(ids);
    const deleted = await this.repository.bulkSoftDelete(ids);
    await clearCachePattern(`assessment-indicator:placement:*`);

    if (actorId && indicators.length > 0) {
      const placementIds = [...new Set(indicators.map((ind) => ind.placementId))];
      for (const placementId of placementIds) {
        const count = indicators.filter((ind) => ind.placementId === placementId).length;
        await this.logIndicatorActivity(
          placementId,
          actorId,
          'INDICATOR_DELETED',
          '{admin} menghapus {count} indikator penilaian untuk murid {student} di {company}.',
          'Admin menghapus indikator penilaian untuk penempatan magangmu di {company}.',
          { count: String(count) },
        );
      }
    }

    return deleted;
  }
}

export const assessmentIndicatorService = new AssessmentIndicatorService(assessmentIndicatorRepository);
