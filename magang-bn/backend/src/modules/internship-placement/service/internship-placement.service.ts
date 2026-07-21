import { InternshipPlacementRepository, internshipPlacementRepository } from '@/modules/internship-placement/repository/index.js';
import { CreateInternshipPlacementDto, UpdateInternshipPlacementDto, BulkCreateInternshipPlacementDto, BulkUpdateStatusDto, BulkUpdateAssessableDto } from '@/modules/internship-placement/domain/index.js';
import { NotFoundError, BadRequestError } from '@/errors/index.js';
import { withCache, clearCachePattern, setCache } from '@/utils/cache.js';
import { prisma } from '@/database/index.js';
import { Prisma, PlacementStatus } from '@/database/generated/client/index.js';
import { activityService } from '@/modules/activity/service/index.js';
import { getAdminName, getReviewerName } from '@/utils/activity-helper.js';

export class InternshipPlacementService {
  constructor(private repository: InternshipPlacementRepository) {}

  async getAll(page: number, limit: number, search?: string, studentId?: string, mentorId?: string, teacherId?: string, status?: string, companyId?: string) {
    let cacheKey = `internship-placement:all:page:${page}:limit:${limit}`;
    if (search) cacheKey += `:search:${search}`;
    if (studentId) cacheKey += `:studentId:${studentId}`;
    if (mentorId) cacheKey += `:mentorId:${mentorId}`;
    if (teacherId) cacheKey += `:teacherId:${teacherId}`;
    if (status) cacheKey += `:status:${status}`;
    if (companyId) cacheKey += `:companyId:${companyId}`;
    return withCache(cacheKey, 600, async () => {
      const skip = (page - 1) * limit;
      let whereClause: Prisma.InternshipPlacementWhereInput = {};
      
      if (search) {
        whereClause.OR = [
          { student: { name: { contains: search, mode: 'insensitive' } } },
          { company: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }
      if (studentId) {
        whereClause.studentId = studentId;
      }
      if (mentorId) {
        whereClause.industryMentorId = mentorId;
      }
      if (teacherId) {
        whereClause.teacherId = teacherId;
      }
      if (status) {
        whereClause.status = status as PlacementStatus;
      }
      if (companyId) {
        whereClause.companyId = companyId;
      }

      // if whereClause is empty, pass undefined to avoid Prisma issues though empty object is fine
      const finalWhere = Object.keys(whereClause).length > 0 ? whereClause : undefined;

      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, finalWhere),
        this.repository.count(finalWhere),
      ]);
      return { data, total };
    });
  }

  async getById(id: string) {
    return withCache(`internship-placement:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Data tidak ditemukan');
      return item;
    });
  }

  async create(data: CreateInternshipPlacementDto, actorId?: string) {
    const company = await prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company) throw new NotFoundError('Perusahaan tidak ditemukan');
    
    if (data.industryMentorId) {
      const mentor = await prisma.industryMentor.findUnique({ where: { id: data.industryMentorId } });
      if (!mentor) throw new NotFoundError('Mentor industri tidak ditemukan');
      if (mentor.companyId !== data.companyId) {
        throw new BadRequestError('Mentor yang dipilih tidak berasal dari perusahaan yang sama dengan tempat magang');
      }
    }

    const activeCount = await this.repository.getActivePlacementsCount(data.companyId);
    if (company.quota !== null && activeCount + 1 > company.quota) {
      throw new BadRequestError('Kuota perusahaan tidak mencukupi');
    }

    const endDate = new Date(data.startDate);
    endDate.setDate(endDate.getDate() + data.durationDays);

    const payload = { ...data, endDate };
    const created = await this.repository.create(payload);
    await clearCachePattern(`internship-placement:all:*`);
    await clearCachePattern(`company:all:*`);
    await clearCachePattern(`company:id:${data.companyId}`);
    await setCache(`internship-placement:id:${created.id}`, created, 600);

    if (actorId) {
      const student = await prisma.student.findUnique({ where: { id: data.studentId } });
      const teacher = await prisma.teacher.findUnique({ where: { id: data.teacherId } });
      const mentor = data.industryMentorId ? await prisma.industryMentor.findUnique({ where: { id: data.industryMentorId } }) : null;
      const adminName = await getAdminName(actorId);
      const studentName = student ? student.name : 'Siswa';
      
      await activityService.create({
        actorId,
        description: `${adminName} telah menempatkan murid ${studentName} di perusahaan ${company.name}.`,
        action: 'PLACEMENT_CREATED',
        isForAdmin: true
      });
      if (student?.userId) {
        await activityService.create({
          actorId,
          targetId: student.userId,
          description: `Kamu telah ditempatkan di perusahaan ${company.name} oleh ${adminName}.`,
          action: 'PLACEMENT_CREATED',
          isForAdmin: false
        });
      }
      if (teacher?.userId) {
        await activityService.create({
          actorId,
          targetId: teacher.userId,
          description: `Anda ditunjuk sebagai pembimbing magang dari ${studentName} di perusahaan ${company.name} oleh ${adminName}.`,
          action: 'PLACEMENT_CREATED',
          isForAdmin: false
        });
      }
      if (mentor?.userId) {
        await activityService.create({
          actorId,
          targetId: mentor.userId,
          description: `Anda ditunjuk sebagai pembimbing magang dari ${studentName} di perusahaan ${company.name} oleh ${adminName}.`,
          action: 'PLACEMENT_CREATED',
          isForAdmin: false
        });
      }
    }

    return created;
  }

  async bulkCreate(data: BulkCreateInternshipPlacementDto, actorId?: string) {
    const company = await prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company) throw new NotFoundError('Perusahaan tidak ditemukan');

    if (data.industryMentorId) {
      const mentor = await prisma.industryMentor.findUnique({ where: { id: data.industryMentorId } });
      if (!mentor) throw new NotFoundError('Mentor industri tidak ditemukan');
      if (mentor.companyId !== data.companyId) {
        throw new BadRequestError('Mentor yang dipilih tidak berasal dari perusahaan yang sama dengan tempat magang');
      }
    }

    const endDate = new Date(data.startDate);
    endDate.setDate(endDate.getDate() + data.durationDays);

    return await prisma.$transaction(async (tx) => {
      const activeCount = await this.repository.getActivePlacementsCount(data.companyId, tx);
      if (company.quota !== null && activeCount + data.studentIds.length > company.quota) {
        throw new BadRequestError('Kuota perusahaan tidak mencukupi');
      }

      const payloads = data.studentIds.map(studentId => ({
        studentId,
        companyId: data.companyId,
        teacherId: data.teacherId,
        industryMentorId: data.industryMentorId,
        startDate: data.startDate,
        durationDays: data.durationDays,
        status: data.status,
        endDate
      }));

      const createdPlacements = await this.repository.bulkCreate(payloads, tx);
      await clearCachePattern(`internship-placement:all:*`);
      await clearCachePattern(`company:all:*`);
      await clearCachePattern(`company:id:${data.companyId}`);

      if (actorId) {
        const adminName = await getAdminName(actorId);
        await activityService.create({
          actorId,
          description: `${adminName} menempatkan ${payloads.length} murid di ${company.name}.`,
          action: 'PLACEMENT_CREATED',
          isForAdmin: true
        });

        const students = await tx.student.findMany({ where: { id: { in: data.studentIds } } });
        const teacher = await tx.teacher.findUnique({ where: { id: data.teacherId } });
        const mentor = data.industryMentorId ? await tx.industryMentor.findUnique({ where: { id: data.industryMentorId } }) : null;

        for (const student of students) {
          if (student.userId) {
            await activityService.create({ actorId, targetId: student.userId, description: `Kamu telah ditempatkan di perusahaan ${company.name} oleh ${adminName}.`, action: 'PLACEMENT_CREATED', isForAdmin: false });
          }
          if (teacher?.userId) {
            await activityService.create({ actorId, targetId: teacher.userId, description: `Anda ditunjuk sebagai pembimbing magang dari ${student.name} di perusahaan ${company.name} oleh ${adminName}.`, action: 'PLACEMENT_CREATED', isForAdmin: false });
          }
          if (mentor?.userId) {
            await activityService.create({ actorId, targetId: mentor.userId, description: `Anda ditunjuk sebagai pembimbing magang dari ${student.name} di perusahaan ${company.name} oleh ${adminName}.`, action: 'PLACEMENT_CREATED', isForAdmin: false });
          }
        }
      }

      return { count: payloads.length, studentIds: data.studentIds };
    });
  }


  async update(id: string, data: UpdateInternshipPlacementDto, actorId?: string) {
    const existing = await this.getById(id);
    
    const companyId = data.companyId || existing.companyId;
    const mentorId = data.industryMentorId !== undefined ? data.industryMentorId : existing.industryMentorId;
    
    if (mentorId) {
      const mentor = await prisma.industryMentor.findUnique({ where: { id: mentorId } });
      if (!mentor) throw new NotFoundError('Mentor industri tidak ditemukan');
      if (mentor.companyId !== companyId) {
        throw new BadRequestError('Mentor yang dipilih tidak berasal dari perusahaan yang sama dengan tempat magang');
      }
    }
    const updated = await this.repository.update(id, data);
    await clearCachePattern(`internship-placement:all:*`);
    await clearCachePattern(`company:all:*`);
    await clearCachePattern(`company:id:${companyId}`);
    await setCache(`internship-placement:id:${id}`, updated, 600);

    if (actorId && data.status) {
      const student = await prisma.student.findUnique({ where: { id: existing.studentId } });
      const teacher = await prisma.teacher.findUnique({ where: { id: existing.teacherId } });
      const mentor = existing.industryMentorId ? await prisma.industryMentor.findUnique({ where: { id: existing.industryMentorId } }) : null;
      const adminName = await getAdminName(actorId);
      const studentName = student ? student.name : 'Siswa';
      const companyName = existing.company?.name || 'Perusahaan';
      
      await activityService.create({
        actorId,
        description: `${adminName} mengubah status magang murid ${studentName} di perusahaan ${companyName} menjadi ${data.status}.`,
        action: 'PLACEMENT_STATUS_UPDATED',
        isForAdmin: true
      });
      if (student?.userId) {
        await activityService.create({
          actorId,
          targetId: student.userId,
          description: `Status magangmu di perusahaan ${companyName} telah diubah menjadi ${data.status} oleh ${adminName}.`,
          action: 'PLACEMENT_STATUS_UPDATED',
          isForAdmin: false
        });
      }
      if (teacher?.userId) {
        await activityService.create({ actorId, targetId: teacher.userId, description: `Status magang murid ${studentName} di perusahaan ${companyName} telah diubah menjadi ${data.status} oleh ${adminName}.`, action: 'PLACEMENT_STATUS_UPDATED', isForAdmin: false });
      }
      if (mentor?.userId) {
        await activityService.create({ actorId, targetId: mentor.userId, description: `Status magang murid ${studentName} di perusahaan ${companyName} telah diubah menjadi ${data.status} oleh ${adminName}.`, action: 'PLACEMENT_STATUS_UPDATED', isForAdmin: false });
      }
    }

    return updated;
  }

  async delete(id: string, actorId?: string) {
    const existing = await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern(`internship-placement:all:*`);
    await clearCachePattern(`internship-placement:id:${id}`);
    await clearCachePattern(`company:all:*`);
    await clearCachePattern(`company:id:${existing.companyId}`);

    if (actorId) {
      const adminName = await getAdminName(actorId);
      const student = await prisma.student.findUnique({ where: { id: existing.studentId } });
      const teacher = await prisma.teacher.findUnique({ where: { id: existing.teacherId } });
      const mentor = existing.industryMentorId ? await prisma.industryMentor.findUnique({ where: { id: existing.industryMentorId } }) : null;
      const studentName = student ? student.name : 'Siswa';
      const companyName = existing.company?.name || 'Perusahaan';
      
      await activityService.create({
        actorId,
        description: `${adminName} menghapus data penempatan magang murid ${studentName} di perusahaan ${companyName}.`,
        action: 'PLACEMENT_DELETED',
        isForAdmin: true
      });
      
      if (student?.userId) {
        await activityService.create({ actorId, targetId: student.userId, description: `Data penempatan magangmu di perusahaan ${companyName} telah dihapus oleh ${adminName}.`, action: 'PLACEMENT_DELETED', isForAdmin: false });
      }
      if (teacher?.userId) {
        await activityService.create({ actorId, targetId: teacher.userId, description: `Data penempatan magang murid ${studentName} di perusahaan ${companyName} telah dihapus oleh ${adminName}.`, action: 'PLACEMENT_DELETED', isForAdmin: false });
      }
      if (mentor?.userId) {
        await activityService.create({ actorId, targetId: mentor.userId, description: `Data penempatan magang murid ${studentName} di perusahaan ${companyName} telah dihapus oleh ${adminName}.`, action: 'PLACEMENT_DELETED', isForAdmin: false });
      }
    }

    return deleted;
  }
  async bulkDelete(ids: string[], actorId?: string) {
    const deleted = await this.repository.bulkSoftDelete(ids);
    await clearCachePattern(`internship-placement:all:*`);
    await clearCachePattern(`company:all:*`);

    if (actorId) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} menghapus ${ids.length} data penempatan magang.`,
        action: 'PLACEMENT_DELETED',
        isForAdmin: true
      });

      const placements = await prisma.internshipPlacement.findMany({
        where: { id: { in: ids } },
        include: { student: true, teacher: true, industryMentor: true, company: true }
      });
      for (const placement of placements) {
        const studentName = placement.student?.name || 'Siswa';
        const companyName = placement.company?.name || 'Perusahaan';
        if (placement.student?.userId) {
          await activityService.create({ actorId, targetId: placement.student.userId, description: `Data penempatan magangmu di perusahaan ${companyName} telah dihapus oleh ${adminName}.`, action: 'PLACEMENT_DELETED', isForAdmin: false });
        }
        if (placement.teacher?.userId) {
          await activityService.create({ actorId, targetId: placement.teacher.userId, description: `Data penempatan magang murid ${studentName} di perusahaan ${companyName} telah dihapus oleh ${adminName}.`, action: 'PLACEMENT_DELETED', isForAdmin: false });
        }
        if (placement.industryMentor?.userId) {
          await activityService.create({ actorId, targetId: placement.industryMentor.userId, description: `Data penempatan magang murid ${studentName} di perusahaan ${companyName} telah dihapus oleh ${adminName}.`, action: 'PLACEMENT_DELETED', isForAdmin: false });
        }
      }
    }

    return deleted;
  }
  async bulkUpdateStatus(data: BulkUpdateStatusDto, actorId?: string) {
    const updated = await this.repository.bulkUpdateStatus(data.ids, data.status as PlacementStatus);
    await clearCachePattern(`internship-placement:all:*`);
    await clearCachePattern(`company:all:*`);
    if (actorId) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} memperbarui status ${data.ids.length} penempatan magang menjadi ${data.status}.`,
        action: 'PLACEMENT_STATUS_UPDATED',
        isForAdmin: true
      });

      const placements = await prisma.internshipPlacement.findMany({
        where: { id: { in: data.ids } },
        include: { student: true, teacher: true, industryMentor: true, company: true }
      });
      for (const placement of placements) {
        const studentName = placement.student?.name || 'Siswa';
        const companyName = placement.company?.name || 'Perusahaan';
        if (placement.student?.userId) {
          await activityService.create({ actorId, targetId: placement.student.userId, description: `Status magangmu di perusahaan ${companyName} telah diubah menjadi ${data.status} oleh ${adminName}.`, action: 'PLACEMENT_STATUS_UPDATED', isForAdmin: false });
        }
        if (placement.teacher?.userId) {
          await activityService.create({ actorId, targetId: placement.teacher.userId, description: `Status magang murid ${studentName} di perusahaan ${companyName} telah diubah menjadi ${data.status} oleh ${adminName}.`, action: 'PLACEMENT_STATUS_UPDATED', isForAdmin: false });
        }
        if (placement.industryMentor?.userId) {
          await activityService.create({ actorId, targetId: placement.industryMentor.userId, description: `Status magang murid ${studentName} di perusahaan ${companyName} telah diubah menjadi ${data.status} oleh ${adminName}.`, action: 'PLACEMENT_STATUS_UPDATED', isForAdmin: false });
        }
      }
    }
    for (const id of data.ids) {
      await clearCachePattern(`internship-placement:id:${id}`);
    }
    return updated;
  }

  async bulkUpdateAssessable(data: BulkUpdateAssessableDto, actorId?: string) {
    const updated = await this.repository.bulkUpdateAssessable(data.ids, data.isAssessable);
    await clearCachePattern(`internship-placement:all:*`);
    await clearCachePattern(`company:all:*`);
    if (actorId) {
      const adminName = await getAdminName(actorId);
      const assessableTxt = data.isAssessable ? 'Bisa Dinilai' : 'Belum Bisa Dinilai';
      await activityService.create({
        actorId,
        description: `${adminName} memperbarui status akses nilai ${data.ids.length} penempatan magang menjadi ${assessableTxt}.`,
        action: 'PLACEMENT_UPDATED',
        isForAdmin: true
      });

      const placements = await prisma.internshipPlacement.findMany({
        where: { id: { in: data.ids } },
        include: { student: true, teacher: true, industryMentor: true, company: true }
      });
      for (const placement of placements) {
        const studentName = placement.student?.name || 'Siswa';
        const companyName = placement.company?.name || 'Perusahaan';
        if (placement.student?.userId) {
          await activityService.create({ actorId, targetId: placement.student.userId, description: `Status akses nilai magangmu di perusahaan ${companyName} telah diperbarui menjadi ${assessableTxt} oleh ${adminName}.`, action: 'PLACEMENT_UPDATED', isForAdmin: false });
        }
        if (placement.teacher?.userId) {
          await activityService.create({ actorId, targetId: placement.teacher.userId, description: `Status akses nilai magang murid ${studentName} di perusahaan ${companyName} telah diperbarui menjadi ${assessableTxt} oleh ${adminName}.`, action: 'PLACEMENT_UPDATED', isForAdmin: false });
        }
        if (placement.industryMentor?.userId) {
          await activityService.create({ actorId, targetId: placement.industryMentor.userId, description: `Status akses nilai magang murid ${studentName} di perusahaan ${companyName} telah diperbarui menjadi ${assessableTxt} oleh ${adminName}.`, action: 'PLACEMENT_UPDATED', isForAdmin: false });
        }
      }
    }
    for (const id of data.ids) {
      await clearCachePattern(`internship-placement:id:${id}`);
    }
    return updated;
  }

  async updateCertificate(id: string, certificateUrl: string, actorId?: string) {
    await this.getById(id);
    const updated = await prisma.internshipPlacement.update({
      where: { id },
      data: { certificateUrl }
    });
    await clearCachePattern(`internship-placement:all:*`);
    await setCache(`internship-placement:id:${id}`, updated, 600);

    if (actorId) {
      const reviewerName = await getReviewerName(actorId);
      const existing = await this.getById(id);
      const student = await prisma.student.findUnique({ where: { id: existing.studentId } });
      const teacher = await prisma.teacher.findUnique({ where: { id: existing.teacherId } });
      const mentor = existing.industryMentorId ? await prisma.industryMentor.findUnique({ where: { id: existing.industryMentorId } }) : null;
      const studentName = student ? student.name : 'Siswa';
      const companyName = existing.company?.name || 'Perusahaan';
      
      await activityService.create({
        actorId,
        description: `Mentor ${reviewerName} mengunggah sertifikat magang untuk murid ${studentName} di perusahaan ${companyName}.`,
        action: 'CERTIFICATE_UPLOADED',
        isForAdmin: true
      });
      if (student?.userId) {
        await activityService.create({
          actorId,
          targetId: student.userId,
          description: `Sertifikat magangmu di perusahaan ${companyName} telah diunggah oleh Mentor ${reviewerName}.`,
          action: 'CERTIFICATE_UPLOADED',
          isForAdmin: false
        });
      }
      if (teacher?.userId) {
        await activityService.create({ actorId, targetId: teacher.userId, description: `Sertifikat magang murid ${studentName} di perusahaan ${companyName} telah diunggah oleh Mentor ${reviewerName}.`, action: 'CERTIFICATE_UPLOADED', isForAdmin: false });
      }
      
      await activityService.create({ actorId, description: `Kamu telah mengunggah sertifikat magang untuk murid ${studentName} di perusahaan ${companyName}.`, action: 'CERTIFICATE_UPLOADED', isForAdmin: false });
    }

    return updated;
  }
}

export const internshipPlacementService = new InternshipPlacementService(internshipPlacementRepository);
