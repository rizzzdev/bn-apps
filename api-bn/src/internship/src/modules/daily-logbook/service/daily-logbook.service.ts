import { DailyLogbookRepository, dailyLogbookRepository } from '@internship/modules/daily-logbook/repository/index.js';
import { CreateDailyLogbookDto, UpdateDailyLogbookDto } from '@internship/modules/daily-logbook/domain/index.js';
import { NotFoundError } from '@app/index.js';
import { withCache, clearCachePattern, setCache, putOptionalToNull } from '@app/index.js';
import { prisma } from '@internship/database/index.js';
import { activityService } from '@internship/modules/activity/service/index.js';
import { getAdminName, getReviewerName } from '@internship/utils/activity-helper.js';
import { Prisma, LogbookApprovalStatus } from '@internship/database/index.js';
import path from 'path';
import fs from 'fs';

const DAILY_LOGBOOK_NULLABLE_UPDATE_FIELDS = ['description'] as const;

export class DailyLogbookService {
  constructor(private repository: DailyLogbookRepository) {}

  async getAll(page: number, limit: number, placementId?: string, studentId?: string, companyId?: string, search?: string, mentorId?: string, teacherId?: string, status?: string) {
    const cacheKey = `daily-logbook:all:page:${page}:limit:${limit}:placementId:${placementId || 'all'}:studentId:${studentId || 'all'}:companyId:${companyId || 'all'}:mentorId:${mentorId || 'all'}:teacherId:${teacherId || 'all'}:search:${search || 'none'}:status:${status || 'all'}`;
      
    return withCache(cacheKey, 600, async () => {
      const skip = (page - 1) * limit;
      let whereClause: Prisma.DailyLogbookWhereInput | undefined = {};
      
      if (placementId) whereClause.placementId = placementId;
      
      if (studentId || companyId || mentorId || teacherId) {
        whereClause.placement = {};
        if (studentId) whereClause.placement.studentId = studentId;
        if (companyId) whereClause.placement.companyId = companyId;
        if (mentorId) whereClause.placement.industryMentorId = mentorId;
        if (teacherId) whereClause.placement.teacherId = teacherId;
      }
      
      if (search) {
        whereClause.OR = [
          { activityTitle: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) {
        if (teacherId) {
          whereClause.teacherStatus = status as LogbookApprovalStatus;
        } else if (mentorId) {
          whereClause.mentorStatus = status as LogbookApprovalStatus;
        } else {
          whereClause.OR = [
            ...(whereClause.OR || []),
            { teacherStatus: status as LogbookApprovalStatus },
            { mentorStatus: status as LogbookApprovalStatus }
          ];
        }
      }

      if (Object.keys(whereClause).length === 0) {
        whereClause = undefined;
      }

      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, whereClause),
        this.repository.count(whereClause),
      ]);
      return { data, total };
    });
  }

  async getById(id: string) {
    return withCache(`daily-logbook:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Data tidak ditemukan');
      return item;
    });
  }

  async create(data: CreateDailyLogbookDto, files?: Express.Multer.File[], actorId?: string) {
    const created = await prisma.$transaction(async (tx) => {
      // 1. Create logbook
      const logbook = await tx.dailyLogbook.create({ data: data as Prisma.DailyLogbookUncheckedCreateInput });
      
      // 2. Process attachments
      if (files && files.length > 0) {
        for (const file of files) {
          const sizeMB = file.size / (1024 * 1024);
          const ext = file.originalname.split('.').pop() || '';
          const url = `/api/v1/attachments/file/${file.filename}`;
          
          await tx.attachment.create({
            data: {
              filename: file.originalname,
              format: ext,
              size: parseFloat(sizeMB.toFixed(2)),
              url,
              logbookId: logbook.id
            }
          });
        }
      }
      return logbook;
    });

    await clearCachePattern(`daily-logbook:all:*`);
    await setCache(`daily-logbook:id:${created.id}`, created, 600);

    if (actorId) {
      const placement = await prisma.internshipPlacement.findUnique({
        where: { id: created.placementId },
        include: { student: true, teacher: true, industryMentor: true, company: true }
      });
      const studentName = placement?.student?.name || 'Siswa';
      const companyName = placement?.company?.name || 'Perusahaan';
      
      await activityService.create({
        actorId,
        description: `Murid ${studentName} telah mengisi logbook harian: "${created.activityTitle}" di perusahaan ${companyName}.`,
        action: 'LOGBOOK_CREATED',
        isForAdmin: true
      });
      
      await activityService.create({
        actorId,
        description: `Kamu telah mengisi logbook harian: "${created.activityTitle}" di perusahaan ${companyName}.`,
        action: 'LOGBOOK_CREATED',
        isForAdmin: false
      });
      
      const desc = `Murid ${studentName} telah mengisi logbook harian: "${created.activityTitle}" di perusahaan ${companyName}. Silakan lakukan review.`;
      if (placement?.teacher?.userId) {
        await activityService.create({ actorId, targetId: placement.teacher.userId, description: desc, action: 'LOGBOOK_CREATED', isForAdmin: false });
      }
      if (placement?.industryMentor?.userId) {
        await activityService.create({ actorId, targetId: placement.industryMentor.userId, description: desc, action: 'LOGBOOK_CREATED', isForAdmin: false });
      }
    }

    return created;
  }

  async update(id: string, data: UpdateDailyLogbookDto, files?: Express.Multer.File[], actorId?: string) {
    await this.getById(id);
    
    const { deletedAttachmentIds, ...rawLogbookData } = data;
    const logbookData = putOptionalToNull(rawLogbookData, DAILY_LOGBOOK_NULLABLE_UPDATE_FIELDS);

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update logbook
      const logbook = await tx.dailyLogbook.update({ where: { id }, data: logbookData as Prisma.DailyLogbookUpdateInput });
      
      // 2. Process NEW attachments (append)
      if (files && files.length > 0) {
        for (const file of files) {
          const sizeMB = file.size / (1024 * 1024);
          const ext = file.originalname.split('.').pop() || '';
          const url = `/api/v1/attachments/file/${file.filename}`;
          
          await tx.attachment.create({
            data: {
              filename: file.originalname,
              format: ext,
              size: parseFloat(sizeMB.toFixed(2)),
              url,
              logbookId: logbook.id
            }
          });
        }
      }

      // 3. Process DELETED attachments
      if (deletedAttachmentIds && deletedAttachmentIds.length > 0) {
        // Find them first to get file paths to delete
        const attachmentsToDelete = await tx.attachment.findMany({
          where: { id: { in: deletedAttachmentIds } }
        });

        // Delete attachments from DB
        await tx.attachment.deleteMany({
          where: { id: { in: deletedAttachmentIds } }
        });

        // Delete physical files from disk
        for (const att of attachmentsToDelete) {
          if (att.url) {
            const filename = att.url.split('/').pop();
            if (filename) {
              const filePath = path.resolve(process.cwd(), 'public/attachments', filename);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            }
          }
        }
      }
      
      return logbook;
    });

    await clearCachePattern(`daily-logbook:all:*`);
    await setCache(`daily-logbook:id:${id}`, updated, 600);

    if (actorId) {
      const placement = await prisma.internshipPlacement.findUnique({
        where: { id: updated.placementId },
        include: { student: true, teacher: true, industryMentor: true, company: true }
      });
      const studentName = placement?.student?.name || 'Siswa';
      const companyName = placement?.company?.name || 'Perusahaan';
      
      await activityService.create({
        actorId,
        description: `Murid ${studentName} merevisi logbook harian: "${updated.activityTitle}" di perusahaan ${companyName}.`,
        action: 'LOGBOOK_UPDATED',
        isForAdmin: true
      });
      
      await activityService.create({
        actorId,
        description: `Kamu merevisi logbook harian: "${updated.activityTitle}" di perusahaan ${companyName}.`,
        action: 'LOGBOOK_UPDATED',
        isForAdmin: false
      });
      
      const desc = `Murid ${studentName} merevisi logbook harian: "${updated.activityTitle}" di perusahaan ${companyName}. Silakan lakukan review.`;
      if (placement?.teacher?.userId) {
        await activityService.create({ actorId, targetId: placement.teacher.userId, description: desc, action: 'LOGBOOK_UPDATED', isForAdmin: false });
      }
      if (placement?.industryMentor?.userId) {
        await activityService.create({ actorId, targetId: placement.industryMentor.userId, description: desc, action: 'LOGBOOK_UPDATED', isForAdmin: false });
      }
    }

    return updated;
  }

  async addReview(id: string, reviewerId: string, action: string, content?: string, reviewerType: 'teacher' | 'mentor' = 'teacher', actorId?: string) {
    const logbook = await this.getById(id);

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Create review
      const review = await tx.logbookReview.create({
        data: {
          logbookId: id,
          reviewerId,
          action: action as Prisma.LogbookReviewCreateInput['action'],
          content,
        }
      });

      // 2. Update status on logbook
      const status = action === 'approved' ? 'approved' : 'pending';
      let updateData: Prisma.DailyLogbookUpdateInput = {};
      
      if (reviewerType === 'teacher') {
        updateData.teacherStatus = status;
        if (status === 'approved') updateData.teacherApprovedAt = new Date();
      } else {
        updateData.mentorStatus = status;
        if (status === 'approved') updateData.mentorApprovedAt = new Date();
      }

      await tx.dailyLogbook.update({
        where: { id },
        data: updateData
      });

      return review;
    });

    await clearCachePattern(`daily-logbook:all:*`);
    await clearCachePattern(`daily-logbook:id:${id}`);

    if (actorId) {
      const placement = await prisma.internshipPlacement.findUnique({
        where: { id: logbook.placementId },
        include: { student: true, teacher: true, industryMentor: true, company: true }
      });
      const activityAction = action === 'approved' ? 'LOGBOOK_APPROVED' : 'LOGBOOK_REVISED';
      const roleLabel = reviewerType === 'teacher' ? 'Guru' : 'Mentor';
      const reviewerName = reviewerType === 'teacher' ? placement?.teacher?.name : placement?.industryMentor?.name;
      const studentName = placement?.student?.name || 'Siswa';
      const companyName = placement?.company?.name || 'Perusahaan';
      
      const adminDesc = action === 'approved' 
        ? `${roleLabel} ${reviewerName} menyetujui logbook harian murid ${studentName} di perusahaan ${companyName}: "${logbook.activityTitle}".` 
        : `${roleLabel} ${reviewerName} memberikan revisi logbook harian murid ${studentName} di perusahaan ${companyName}: "${logbook.activityTitle}". Catatan: "${content || ''}".`;
        
      const selfDesc = action === 'approved'
        ? `Kamu menyetujui logbook harian milik ${studentName} di perusahaan ${companyName}: "${logbook.activityTitle}".`
        : `Kamu memberikan revisi logbook harian milik ${studentName} di perusahaan ${companyName}: "${logbook.activityTitle}". Catatan: "${content || ''}".`;

      const studentDesc = action === 'approved'
        ? `${roleLabel} ${reviewerName} menyetujui logbook harian di perusahaan ${companyName}: "${logbook.activityTitle}".`
        : `${roleLabel} ${reviewerName} memberikan revisi logbook harian di perusahaan ${companyName}: "${logbook.activityTitle}". Catatan: "${content || ''}".`;
      
      await activityService.create({
        actorId,
        description: adminDesc,
        action: activityAction,
        isForAdmin: true
      });
      
      await activityService.create({
        actorId,
        description: selfDesc,
        action: activityAction,
        isForAdmin: false
      });
      
      if (placement?.student?.userId) {
        await activityService.create({
          actorId,
          targetId: placement.student.userId,
          description: studentDesc,
          action: activityAction,
          isForAdmin: false
        });
      }
    }

    return updated;
  }

  async delete(id: string, actorId?: string) {
    const existing = await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern(`daily-logbook:all:*`);
    await clearCachePattern(`daily-logbook:id:${id}`);

    if (actorId) {
      const companyName = existing.placement?.company?.name || 'Perusahaan';
      await activityService.create({
        actorId,
        description: `Kamu menghapus logbook harian: "${existing.activityTitle}" di perusahaan ${companyName}.`,
        action: 'LOGBOOK_DELETED',
        isForAdmin: false
      });
    }

    return deleted;
  }
  async bulkDelete(ids: string[]) {
    const deleted = await this.repository.bulkSoftDelete(ids);
    await clearCachePattern(`daily-logbook:all:*`);
    return deleted;
  }
}

export const dailyLogbookService = new DailyLogbookService(dailyLogbookRepository);
