import { prisma } from '@/database/index.js';
import { Prisma } from '@/database/generated/client/index.js';
import { parseExcel, generateExcelTemplate } from '@/utils/excel.js';
import { CompanyRepository, companyRepository } from '@/modules/company/repository/index.js';
import { CreateCompanyDto, UpdateCompanyDto } from '@/modules/company/domain/index.js';
import { NotFoundError, BadRequestError } from '@/errors/index.js';
import { withCache, clearCachePattern, setCache } from '@/utils/cache.js';
import { activityService } from '@/modules/activity/service/index.js';
import { getAdminName } from '@/utils/activity-helper.js';

export class CompanyService {
  constructor(private repository: CompanyRepository) {}

  async getAll(page: number, limit: number, search?: string) {
    const cacheKey = search ? `company:all:page:${page}:limit:${limit}:search:${search}` : `company:all:page:${page}:limit:${limit}`;
    return withCache(cacheKey, 600, async () => {
      const skip = (page - 1) * limit;
      let whereClause: Prisma.CompanyWhereInput | undefined = undefined;
      
      if (search) {
        whereClause = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { contactPerson: { contains: search, mode: 'insensitive' } }
          ]
        };
      }

      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, whereClause),
        this.repository.count(whereClause),
      ]);
      const mappedData = data.map((company) => {
        const activeCount = company._count?.internshipPlacements || 0;
        const remainingQuota = Math.max(0, (company.quota || 0) - activeCount);
        return {
          ...company,
          remainingQuota
        };
      });
      return { data: mappedData, total };
    });
  }

  async getById(id: string) {
    return withCache(`company:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Data tidak ditemukan');
      return item;
    });
  }

  async create(data: CreateCompanyDto, actorId?: string) {
    const created = await this.repository.create(data);
    await clearCachePattern(`company:all:*`);
    await setCache(`company:id:${created.id}`, created, 600);

    if (actorId) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} menambahkan data perusahaan baru: ${created.name}.`,
        action: 'COMPANY_CREATED',
        isForAdmin: true
      });
    }

    return created;
  }

  async update(id: string, data: UpdateCompanyDto, actorId?: string) {
    const company = await this.getById(id);
    
    if (data.quota !== undefined && data.quota < (company.quota || 0)) {
        const activeCount = await prisma.internshipPlacement.count({
            where: { companyId: id, status: 'active', deletedAt: null }
        });
        if (data.quota < activeCount) {
            throw new BadRequestError(`Kuota baru (${data.quota}) tidak bisa lebih kecil dari jumlah siswa magang yang sedang aktif (${activeCount}).`);
        }
    }

    const updated = await this.repository.update(id, data);
    await clearCachePattern(`company:all:*`);
    await setCache(`company:id:${id}`, updated, 600);

    if (actorId) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} memperbarui data perusahaan: ${updated.name}.`,
        action: 'COMPANY_UPDATED',
        isForAdmin: true
      });

      const mentors = await prisma.industryMentor.findMany({ where: { companyId: id, userId: { not: null } } });
      for (const mentor of mentors) {
        if (!mentor.userId) continue;
        await activityService.create({
          actorId,
          targetId: mentor.userId,
          description: `Data perusahaan ${updated.name} tempat magang bimbinganmu telah diperbarui oleh ${adminName}.`,
          action: 'COMPANY_UPDATED',
          isForAdmin: false
        });
      }
    }

    return updated;
  }

  async delete(id: string, actorId?: string) {
    const existing = await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern(`company:all:*`);
    await clearCachePattern(`company:id:${id}`);

    if (actorId) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} menghapus data perusahaan: ${existing.name}.`,
        action: 'COMPANY_DELETED',
        isForAdmin: true
      });

      const mentors = await prisma.industryMentor.findMany({ where: { companyId: id, userId: { not: null } } });
      for (const mentor of mentors) {
        if (!mentor.userId) continue;
        await activityService.create({
          actorId,
          targetId: mentor.userId,
          description: `Data perusahaan ${existing.name} tempat magang bimbinganmu telah dihapus oleh ${adminName}.`,
          action: 'COMPANY_DELETED',
          isForAdmin: false
        });
      }
    }

    return deleted;
  }
  async bulkDelete(ids: string[], actorId?: string) {
    const deleted = await this.repository.bulkSoftDelete(ids);
    await clearCachePattern(`company:all:*`);

    if (actorId) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} menghapus data perusahaan: ${ids.length} perusahaan sekaligus.`,
        action: 'COMPANY_DELETED',
        isForAdmin: true
      });

      const mentors = await prisma.industryMentor.findMany({
        where: { companyId: { in: ids }, userId: { not: null } },
        include: { company: true }
      });
      for (const mentor of mentors) {
        if (!mentor.userId) continue;
        const companyName = mentor.company?.name || 'Perusahaan';
        await activityService.create({
          actorId,
          targetId: mentor.userId,
          description: `Data perusahaan ${companyName} tempat magang bimbinganmu telah dihapus oleh ${adminName}.`,
          action: 'COMPANY_DELETED',
          isForAdmin: false
        });
      }
    }

    return deleted;
  }

  async getExcelTemplate() {
    return generateExcelTemplate(['name', 'address', 'contactPerson', 'phone', 'quota'], 'Template Company', {"name":"PT Contoh","address":"Jl. Contoh 123","contactPerson":"Budi","phone":"08123456789","quota":10});
  }

  async bulkCreateJson(formattedRows: Prisma.CompanyCreateManyInput[], actorId?: string) {
    if (!formattedRows || formattedRows.length === 0) {
      throw new BadRequestError('Tidak ada data yang valid untuk diimpor');
    }

    const created = await prisma.company.createMany({ data: formattedRows, skipDuplicates: true });
    await clearCachePattern(`company:all:*`);

    if (actorId && created.count > 0) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} menambahkan data perusahaan baru: ${created.count} perusahaan diimpor.`,
        action: 'COMPANY_CREATED',
        isForAdmin: true
      });
    }

    return created.count;
  }
}

export const companyService = new CompanyService(companyRepository);
