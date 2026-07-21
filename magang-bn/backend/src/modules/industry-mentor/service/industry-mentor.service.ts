import { prisma } from '@/database/index.js';
import { Prisma } from '@/database/generated/client/index.js';
import { parseExcel, generateExcelTemplate } from '@/utils/excel.js';
import { IndustryMentorRepository, industryMentorRepository } from '@/modules/industry-mentor/repository/index.js';
import { CreateIndustryMentorDto, UpdateIndustryMentorDto } from '@/modules/industry-mentor/domain/index.js';
import { NotFoundError, BadRequestError } from '@/errors/index.js';
import { withCache, clearCachePattern, setCache } from '@/utils/cache.js';
import { env } from '@/configs/env.js';
import { activityService } from '@/modules/activity/service/index.js';
import { getAdminName } from '@/utils/activity-helper.js';

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
    const updated = await this.repository.update(id, data);
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



  async bulkCreateJson(formattedRows: any[], actorId?: string) {
    if (!formattedRows || formattedRows.length === 0) {
      throw new BadRequestError('Tidak ada data yang valid untuk diimpor');
    }

    const authResponse = await fetch(env.MASTER_API_URL + "/auth/bulk-register", {
      method: "POST",
      headers: {
        "X-Api-Key": env.MASTER_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        conflictResolution: "skip",
        users: formattedRows.map(row => ({
          identifiers: [
            { type: "email", value: row.email },
            ...(row.phone ? [{ type: "phone", value: row.phone }] : [])
          ],
          password: row.password,
          roles: ["industry_mentor"]
        }))
      })
    });

    const auth = await authResponse.json();
    if (!authResponse.ok || auth.error) {
      throw new BadRequestError(auth.message || "Gagal mendaftarkan user secara massal");
    }

    // Auth API may only return newly created users if conflictResolution is skip.
    const createdUsers = (auth.data?.users || []) as Record<string, unknown>[];
    const emailToUserId = new Map(
      createdUsers.map((u) => {
        const identifiers = (u.identifiers as Record<string, unknown>[]) || [];
        const emailIdentifier = identifiers.find((i) => i.type === "email");
        return [(emailIdentifier?.value as string)?.toLowerCase(), u.id];
      })
    );

    // For emails that were skipped (not in createdUsers), find them in the local IndustryMentor table.
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

    const toInsert = formattedRows.filter(row => emailToUserId.has(row.email.toLowerCase())).map(row => {
      const { password, ...rest } = row;
      return {
        ...rest,
        companyId: null,
        userId: emailToUserId.get(row.email.toLowerCase())
      };
    });

    if (toInsert.length === 0) {
      return 0;
    }

    const created = await prisma.industryMentor.createMany({ data: toInsert as Prisma.IndustryMentorCreateManyInput[], skipDuplicates: true });
    await clearCachePattern(`industry-mentor:all:*`);

    if (actorId && created.count > 0) {
      const adminName = await getAdminName(actorId);
      await activityService.create({
        actorId,
        description: `${adminName} menambahkan data mentor baru: ${created.count} mentor diimpor.`,
        action: 'MENTOR_CREATED',
        isForAdmin: true
      });
      for (const row of toInsert) {
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

    return created.count;
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
