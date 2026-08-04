import { prisma } from '#internship/database/index.js';
import { Prisma } from '#internship/database/index.js';
import { parseExcel, generateExcelTemplate, putOptionalToNull } from '#app';
import { IndustryMentorRepository, industryMentorRepository } from '#internship/modules/industry-mentor/repository/index.js';
import { CreateIndustryMentorDto, UpdateIndustryMentorDto } from '#internship/modules/industry-mentor/domain/index.js';
import { NotFoundError, BadRequestError } from '#app';
import { withCache, clearCachePattern, setCache } from '#app';
import { getOrchestrator } from '#app/orchestrator.js';
import { activityService } from '#internship/modules/activity/service/index.js';
import { getAdminName } from '#internship/utils/activity-helper.js';

const INDUSTRY_MENTOR_NULLABLE_UPDATE_FIELDS = [
  'prefixTitle', 'suffixTitle', 'position', 'phone',
] as const;

export class IndustryMentorService {
  constructor(private repository: IndustryMentorRepository) {}

  async getAll(page: number, limit: number, search?: string) {
    const cacheKey = search ? `industry-mentor:all:page:${page}:limit:${limit}:search:${search}` : `industry-mentor:all:page:${page}:limit:${limit}`;
    return withCache(cacheKey, 600, async () => {
      const skip = (page - 1) * limit;
      let whereClause: Prisma.IndustryMentorWhereInput | undefined = undefined;
      
      if (search) {
        whereClause = {
          name: { contains: search, mode: 'insensitive' }
        };
      }

      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, whereClause),
        this.repository.count(whereClause),
      ]);
      return { data, total };
    });
  }

  async getExcelTemplate() {
    return generateExcelTemplate(
      [
        { label: 'Nama Mentor', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Password', key: 'password' },
        { label: 'Gelar Depan', key: 'prefixTitle' },
        { label: 'Gelar Belakang', key: 'suffixTitle' },
        { label: 'Jabatan', key: 'position' },
        { label: 'Nomor Telepon', key: 'phone' },
      ],
      'Template Mentor',
      {
        name: 'Budi Santoso',
        email: 'budi@company.com',
        password: 'password123',
        prefixTitle: 'Ir.',
        suffixTitle: 'M.T.',
        position: 'Supervisor',
        phone: '08123456789',
      },
    );
  }

  async getById(id: string) {
    return withCache(`industry-mentor:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Data tidak ditemukan');
      return item;
    });
  }

  async create(data: CreateIndustryMentorDto, actorId?: string) {
    const created = await this.repository.create(data);
    await clearCachePattern(`industry-mentor:all:*`);
    await setCache(`industry-mentor:id:${created.id}`, created, 600);

    if (actorId) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} menambahkan data mentor baru: ${created.name}.`,
        action: 'MENTOR_CREATED',
        isForAdmin: true
      });
      if (created.userId) {
        await activityService.create({
          actorId,
          targetId: created.userId,
          description: `Kamu baru saja ditambahkan ke sistem sebagai Mentor oleh ${adminName}.`,
          action: 'MENTOR_CREATED',
          isForAdmin: false
        });
      }
    }

    return created;
  }

  async update(id: string, data: UpdateIndustryMentorDto, actorId?: string) {
    await this.getById(id);
    const updated = await this.repository.update(id, putOptionalToNull(data, INDUSTRY_MENTOR_NULLABLE_UPDATE_FIELDS));
    await clearCachePattern(`industry-mentor:all:*`);
    await setCache(`industry-mentor:id:${id}`, updated, 600);

    if (actorId) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} memperbarui data mentor: ${updated.name}.`,
        action: 'MENTOR_UPDATED',
        isForAdmin: true
      });
      if (updated.userId) {
        await activityService.create({
          actorId,
          targetId: updated.userId,
          description: `Data profil mentormu telah diperbarui oleh ${adminName}.`,
          action: 'MENTOR_UPDATED',
          isForAdmin: false
        });
      }
    }

    return updated;
  }

  async delete(id: string, actorId?: string) {
    const existing = await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern(`industry-mentor:all:*`);
    await clearCachePattern(`industry-mentor:id:${id}`);

    if (actorId) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} menghapus data mentor: ${existing.name}.`,
        action: 'MENTOR_DELETED',
        isForAdmin: true
      });
    }

    return deleted;
  }
  async bulkDelete(ids: string[], actorId?: string) {
    const deleted = await this.repository.bulkSoftDelete(ids);
    await clearCachePattern(`industry-mentor:all:*`);

    if (actorId) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} menghapus data mentor: ${ids.length} mentor sekaligus.`,
        action: 'MENTOR_DELETED',
        isForAdmin: true
      });
    }

    return deleted;
  }

  async bulkUpdateCompanyId(ids: string[], companyId: string | null) {
    const updated = await this.repository.bulkUpdateCompany(ids, companyId);
    await clearCachePattern(`industry-mentor:all:*`);
    return updated;
  }

  /**
   * Bulk insert industry mentors WITHOUT a database transaction.
   * Auth bulkRegister runs ONCE on all rows (skips duplicates internally).
   * Each row is inserted separately with try/catch so per-row errors
   * are recorded but do not abort the rest.
   * Returns: { createdItems, successCount, successRows, failedRows }
   */
  async bulkCreateJson(formattedRows: any[], actorId?: string) {
    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];

    if (!formattedRows || formattedRows.length === 0) {
      return {
        createdItems: [],
        successCount: 0,
        successRows: [],
        failedRows: [{ reason: 'Tidak ada data yang valid untuk diimpor' }],
      };
    }

    // Phase 1: bulk-register users via auth (skips duplicates internally).
    const registeredUsers = await getOrchestrator().masterAuth.bulkRegister(
      formattedRows.map(row => ({
        identifiers: [{ type: "email", value: row.email }],
        password: row.password,
        roles: ["industry_mentor"]
      }))
    );

    const emailToUserId = new Map(
      registeredUsers.map((u) => [u.email.toLowerCase(), u.userId])
    );

    // For emails skipped at register, check if they already exist in local IndustryMentor table.
    const emailsToFind = formattedRows
      .filter(r => !emailToUserId.has(r.email.toLowerCase()))
      .map(r => r.email.toLowerCase());
    if (emailsToFind.length > 0) {
      const existingMentors = await prisma.industryMentor.findMany({
        where: { email: { in: emailsToFind }, deletedAt: null }
      });
      existingMentors.forEach(m => {
        if (m.email && m.userId) emailToUserId.set(m.email.toLowerCase(), m.userId);
      });
    }

    // Phase 2: per-row insert (no transaction). DB lock stays short.
    const successRows: any[] = [];
    for (const row of formattedRows) {
      const userId = emailToUserId.get(row.email.toLowerCase());
      if (!userId) {
        failedRows.push({
          ...row,
          reason: 'Auth registration failed and not found in local mentor table',
        });
        continue;
      }
      const { password, ...rest } = row;
      try {
        const created = await prisma.industryMentor.create({
          data: { ...rest, companyId: null, userId },
        });
        successRows.push(created);
      } catch (err: any) {
        failedRows.push({ ...row, reason: err?.message ?? 'Industry mentor insert error' });
      }
    }

    if (successRows.length > 0) {
      await clearCachePattern(`industry-mentor:all:*`);

      if (actorId) {
        const adminName = await getAdminName(actorId);
        await activityService.create({
          actorId,
          description: `${adminName} menambahkan data mentor baru: ${successRows.length} mentor diimpor.`,
          action: 'MENTOR_CREATED',
          isForAdmin: true
        });
        for (const row of successRows) {
          if (row.userId) {
            await activityService.create({
              actorId,
              targetId: row.userId as string,
              description: `Kamu baru saja ditambahkan ke sistem sebagai Mentor oleh ${adminName}.`,
              action: 'MENTOR_CREATED',
              isForAdmin: false
            });
          }
        }
      }
    }

    return {
      createdItems: successRows,
      successCount: successRows.length,
      successRows,
      failedRows,
    };
  }

  async changePassword(id: string, dto: { newPassword: string }) {
    const item = await this.getById(id);
    if (!item.userId) {
      throw new BadRequestError('Mentor ini tidak memiliki akun (userId)');
    }
    await this.repository.changePassword(item.userId, dto.newPassword);
    return { success: true, message: 'Password berhasil diubah' };
  }
}

export const industryMentorService = new IndustryMentorService(industryMentorRepository);
