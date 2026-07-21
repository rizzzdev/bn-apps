import { AssessmentRepository, assessmentRepository } from '@/modules/assessment/repository/index.js';
import { CreateAssessmentDto, UpdateAssessmentDto } from '@/modules/assessment/domain/index.js';
import { NotFoundError, BadRequestError } from '@/errors/index.js';
import { withCache, clearCachePattern, setCache } from '@/utils/cache.js';
import { prisma } from '@/database/index.js';
import { activityService } from '@/modules/activity/service/index.js';
import { getReviewerName } from '@/utils/activity-helper.js';

export class AssessmentService {
  constructor(private repository: AssessmentRepository) {}

  async getAll(page: number, limit: number) {
    return withCache(`assessment:all:page:${page}:limit:${limit}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit),
        this.repository.count(),
      ]);
      return { data, total };
    });
  }

  async getById(id: string) {
    return withCache(`assessment:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Data tidak ditemukan');
      return item;
    });
  }

  async create(data: CreateAssessmentDto, actorId?: string) {
    const placement = await prisma.internshipPlacement.findUnique({ where: { id: data.placementId } });
    if (!placement) throw new NotFoundError('Data penempatan tidak ditemukan');
    if (!placement.isAssessable) {
      throw new BadRequestError('Penilaian belum dapat dilakukan untuk penempatan ini');
    }

    const created = await prisma.assessment.upsert({
      where: {
        placementId_assessorType: {
          placementId: data.placementId,
          assessorType: data.assessorType
        }
      },
      update: {
        technicalScore: data.technicalScore,
        nonTechnicalScore: data.nonTechnicalScore,
        finalScore: data.finalScore,
        notes: data.notes
      },
      create: {
        ...data
      }
    });
    
    // Check if both mentor and teacher have assessed
    const assessmentCount = await prisma.assessment.count({
      where: {
        placementId: data.placementId,
        deletedAt: null
      }
    });

    if (assessmentCount >= 2) {
      const allAssessments = await prisma.assessment.findMany({
        where: { placementId: data.placementId, deletedAt: null }
      });
      const totalScore = allAssessments.reduce((sum, curr) => sum + Number(curr.finalScore || 0), 0) / assessmentCount;

      await prisma.internshipPlacement.update({
        where: { id: data.placementId },
        data: { status: 'completed' }
      });

      if (actorId) {
        const placement = await prisma.internshipPlacement.findUnique({
          where: { id: data.placementId },
          include: { student: true, teacher: true, industryMentor: true, company: true }
        });
        const studentName = placement?.student?.name || 'Siswa';
        const companyName = placement?.company?.name || 'Perusahaan';
        const formattedScore = totalScore.toFixed(2);

        await activityService.create({
          actorId,
          description: `Status magang murid ${studentName} di perusahaan ${companyName} telah selesai dengan nilai akhir ${formattedScore}.`,
          action: 'PLACEMENT_COMPLETED',
          isForAdmin: true
        });

        await activityService.create({
          actorId,
          description: `Status magang murid ${studentName} di perusahaan ${companyName} telah selesai dengan nilai akhir ${formattedScore}.`,
          action: 'PLACEMENT_COMPLETED',
          isForAdmin: false
        });

        if (placement?.student?.userId) {
          await activityService.create({
            actorId,
            targetId: placement.student.userId,
            description: `Status magangmu di perusahaan ${companyName} telah selesai dengan nilai akhir ${formattedScore}.`,
            action: 'PLACEMENT_COMPLETED',
            isForAdmin: false
          });
        }

        const otherAssessorType = data.assessorType === 'teacher' ? 'industryMentor' : 'teacher';
        const otherAssessorUserId = placement?.[otherAssessorType]?.userId;
        if (otherAssessorUserId) {
          await activityService.create({
            actorId,
            targetId: otherAssessorUserId,
            description: `Status magang murid ${studentName} di perusahaan ${companyName} telah selesai dengan nilai akhir ${formattedScore}.`,
            action: 'PLACEMENT_COMPLETED',
            isForAdmin: false
          });
        }
      }
    }

    await clearCachePattern(`internship-placement:all:*`);
    await clearCachePattern(`internship-placement:id:${data.placementId}`);
    await clearCachePattern(`assessment:all:*`);
    await setCache(`assessment:id:${created.id}`, created, 600);

    if (actorId) {
      const placement = await prisma.internshipPlacement.findUnique({
        where: { id: data.placementId },
        include: { student: true, teacher: true, industryMentor: true, company: true }
      });
      const role = data.assessorType === 'teacher' ? 'Guru' : 'Mentor';
      const studentName = placement?.student?.name || 'Siswa';
      const companyName = placement?.company?.name || 'Perusahaan';
      const reviewerName = await getReviewerName(actorId);

      await activityService.create({
        actorId,
        description: `${role} ${reviewerName} telah memberikan nilai akhir magang murid ${studentName} di perusahaan ${companyName}: ${data.finalScore}.`,
        action: 'ASSESSMENT_SUBMITTED',
        isForAdmin: true
      });

      await activityService.create({
        actorId,
        description: `Kamu telah memberikan nilai akhir magang untuk murid ${studentName} di perusahaan ${companyName}: ${data.finalScore}.`,
        action: 'ASSESSMENT_SUBMITTED',
        isForAdmin: false
      });

      if (placement?.student?.userId) {
        await activityService.create({
          actorId,
          targetId: placement.student.userId,
          description: `${role} ${reviewerName} telah memberikan nilai akhir magang di perusahaan ${companyName}: ${data.finalScore}.`,
          action: 'ASSESSMENT_SUBMITTED',
          isForAdmin: false
        });
      }
    }

    return created;
  }

  async update(id: string, data: UpdateAssessmentDto, actorId?: string) {
    const existing = await this.getById(id);
    const placement = await prisma.internshipPlacement.findUnique({ where: { id: existing.placementId } });
    if (placement && !placement.isAssessable) {
      throw new BadRequestError('Penilaian belum dapat dilakukan untuk penempatan ini');
    }

    const updated = await this.repository.update(id, data);
    await clearCachePattern(`assessment:all:*`);
    await setCache(`assessment:id:${id}`, updated, 600);
    
    if (actorId) {
      const placement = await prisma.internshipPlacement.findUnique({
        where: { id: updated.placementId },
        include: { student: true, teacher: true, industryMentor: true, company: true }
      });
      const role = updated.assessorType === 'teacher' ? 'Guru' : 'Mentor';
      const studentName = placement?.student?.name || 'Siswa';
      const companyName = placement?.company?.name || 'Perusahaan';
      const reviewerName = await getReviewerName(actorId);
      
      await activityService.create({
        actorId,
        description: `${role} ${reviewerName} merevisi nilai magang murid ${studentName} di perusahaan ${companyName} menjadi: ${updated.finalScore}.`,
        action: 'ASSESSMENT_UPDATED',
        isForAdmin: true
      });

      await activityService.create({
        actorId,
        description: `Kamu merevisi nilai akhir magang murid ${studentName} di perusahaan ${companyName} menjadi: ${updated.finalScore}.`,
        action: 'ASSESSMENT_UPDATED',
        isForAdmin: false
      });

      if (placement?.student?.userId) {
        await activityService.create({
          actorId,
          targetId: placement.student.userId,
          description: `${role} ${reviewerName} merevisi nilai akhir magang di perusahaan ${companyName} menjadi: ${updated.finalScore}.`,
          action: 'ASSESSMENT_UPDATED',
          isForAdmin: false
        });
      }
    }
    
    return updated;
  }

  async updateCertificate(id: string, attachmentId: string, actorId?: string) {
    const existing = await this.getById(id);

    // Clean up old attachment if replacing
    if (existing.attachmentId && existing.attachmentId !== attachmentId) {
      await prisma.attachment.deleteMany({ where: { id: existing.attachmentId } });
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: { attachmentId },
      include: { placement: { include: { student: true, teacher: true, company: true } } }
    });

    // Sync certificateUrl to InternshipPlacement
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    if (attachment?.url) {
      await prisma.internshipPlacement.update({
        where: { id: updated.placementId },
        data: { certificateUrl: attachment.url }
      });
    }

    await clearCachePattern(`assessment:all:*`);
    await setCache(`assessment:id:${id}`, updated, 600);
    // Also clear placement cache because placement fetches assessments
    await clearCachePattern(`internship-placement:all:*`);
    await clearCachePattern(`internship-placement:id:${updated.placementId}`);

    if (actorId && updated.assessorType === 'industry_mentor') {
      const studentName = updated.placement?.student?.name || 'Siswa';
      const companyName = updated.placement?.company?.name || 'Perusahaan';
      const reviewerName = await getReviewerName(actorId);
      
      await activityService.create({
        actorId,
        description: `Mentor ${reviewerName} mengunggah sertifikat/dokumen untuk murid ${studentName} di perusahaan ${companyName}.`,
        action: 'CERTIFICATE_UPLOADED',
        isForAdmin: true
      });
      await activityService.create({
        actorId,
        description: `Kamu telah mengunggah sertifikat/dokumen untuk murid ${studentName} di perusahaan ${companyName}.`,
        action: 'CERTIFICATE_UPLOADED',
        isForAdmin: false
      });
      if (updated.placement?.student?.userId) {
        await activityService.create({
          actorId,
          targetId: updated.placement.student.userId,
          description: `Sertifikat/dokumen magangmu di perusahaan ${companyName} telah diunggah oleh Mentor ${reviewerName}.`,
          action: 'CERTIFICATE_UPLOADED',
          isForAdmin: false
        });
      }
      if (updated.placement?.teacher?.userId) {
        await activityService.create({
          actorId,
          targetId: updated.placement.teacher.userId,
          description: `Sertifikat/dokumen murid ${studentName} di perusahaan ${companyName} telah diunggah oleh Mentor ${reviewerName}.`,
          action: 'CERTIFICATE_UPLOADED',
          isForAdmin: false
        });
      }
    }

    return updated;
  }

  async removeCertificate(id: string, actorId?: string) {
    const existing = await this.getById(id);
    if (!existing.attachmentId) throw new NotFoundError('Sertifikat tidak ditemukan');

    const updated = await prisma.assessment.update({
      where: { id },
      data: { attachmentId: null },
      include: { placement: { include: { student: true, teacher: true, company: true } } }
    });
    
    await prisma.attachment.deleteMany({
      where: { id: existing.attachmentId }
    });

    // Sync certificateUrl to InternshipPlacement (only if no other assessment still has a certificate)
    const otherWithCert = await prisma.assessment.findFirst({
      where: {
        placementId: updated.placementId,
        id: { not: id },
        attachmentId: { not: null },
        deletedAt: null
      }
    });
    if (!otherWithCert) {
      await prisma.internshipPlacement.update({
        where: { id: updated.placementId },
        data: { certificateUrl: null }
      });
    }

    await clearCachePattern(`assessment:all:*`);
    await setCache(`assessment:id:${id}`, updated, 600);
    await clearCachePattern(`internship-placement:all:*`);
    await clearCachePattern(`internship-placement:id:${updated.placementId}`);

    if (actorId && existing.assessorType === 'industry_mentor') {
      const studentName = updated.placement?.student?.name || 'Siswa';
      const companyName = updated.placement?.company?.name || 'Perusahaan';
      const reviewerName = await getReviewerName(actorId);

      await activityService.create({
        actorId,
        description: `Mentor ${reviewerName} telah menghapus sertifikat/dokumen murid ${studentName} di perusahaan ${companyName}.`,
        action: 'CERTIFICATE_DELETED',
        isForAdmin: true
      });
      await activityService.create({
        actorId,
        description: `Kamu telah menghapus sertifikat/dokumen untuk murid ${studentName} di perusahaan ${companyName}.`,
        action: 'CERTIFICATE_DELETED',
        isForAdmin: false
      });
      if (updated.placement?.student?.userId) {
        await activityService.create({
          actorId,
          targetId: updated.placement.student.userId,
          description: `Sertifikat/dokumen magangmu di perusahaan ${companyName} telah dihapus oleh Mentor ${reviewerName} (mungkin terdapat kesalahan).`,
          action: 'CERTIFICATE_DELETED',
          isForAdmin: false
        });
      }
      if (updated.placement?.teacher?.userId) {
        await activityService.create({
          actorId,
          targetId: updated.placement.teacher.userId,
          description: `Sertifikat/dokumen murid ${studentName} di perusahaan ${companyName} telah dihapus oleh Mentor ${reviewerName}.`,
          action: 'CERTIFICATE_DELETED',
          isForAdmin: false
        });
      }
    }

    return updated;
  }

  async delete(id: string, actorId?: string) {
    await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern(`assessment:all:*`);
    await clearCachePattern(`assessment:id:${id}`);
    return deleted;
  }
  async bulkDelete(ids: string[]) {
    const deleted = await this.repository.bulkSoftDelete(ids);
    await clearCachePattern(`assessment:all:*`);
    return deleted;
  }
}

export const assessmentService = new AssessmentService(assessmentRepository);
