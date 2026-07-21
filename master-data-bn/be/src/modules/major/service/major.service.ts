import { MajorRepository, majorRepository } from '@/modules/major/repository';
import { CreateMajorDto, UpdateMajorDto } from '@/modules/major/domain';
import { BadRequestError, NotFoundError } from '@/errors';
import { prisma } from '@/database';
import { withCache, clearCachePattern, setCache } from '@/utils/cache';
import { sendWebhook } from '@/utils/webhook';

export class MajorService {
  constructor(private repository: MajorRepository) {}

  async getAll(page: number, limit: number, includeClasses: boolean = false, includeCurrentStudent: boolean = false) {
    return withCache(`major:all:page:${page}:limit:${limit}:classes:${includeClasses}:includeCurrentStudent:${includeCurrentStudent}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, includeClasses, includeCurrentStudent),
        this.repository.count()
      ]);
      return { data, total };
    });
  }

  async getById(id: string, includeClasses: boolean = false, includeCurrentStudent: boolean = false) {
    return withCache(`major:id:${id}:classes:${includeClasses}:includeCurrentStudent:${includeCurrentStudent}`, 600, async () => {
      const item = await this.repository.findById(id, includeClasses, includeCurrentStudent);
      if (!item) throw new NotFoundError('Jurusan tidak ditemukan');
      return item;
    });
  }

  async validateUnique(data: Partial<CreateMajorDto>, excludeId?: string) {
    if (data.code) {
      const exists = await this.repository.checkUnique('code', data.code, excludeId);
      if (exists) throw new BadRequestError('Major code already exists');
    }
    if (data.name) {
      const exists = await this.repository.checkUnique('name', data.name, excludeId);
      if (exists) throw new BadRequestError('Major name already exists');
    }
  }

  async create(data: CreateMajorDto) {
    await this.validateUnique(data);
    const created = await this.repository.create(data);
    await clearCachePattern('major:all:*');
    await setCache(`major:id:${created.id}`, created, 600);
    sendWebhook('majors', created);
    return created;
  }

  async update(id: string, data: UpdateMajorDto) {
    await this.getById(id);
    await this.validateUnique(data, id);
    const updated = await this.repository.update(id, data);
    await clearCachePattern('major:all:*');
    await setCache(`major:id:${id}`, updated, 600);
    sendWebhook('majors', updated);
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    const classes = await prisma.class.findFirst({ where: { majorId: id, deletedAt: null } });
    if (classes) throw new BadRequestError('Cannot delete Major because it still has active Classes.');
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern('major:all:*');
    await clearCachePattern(`major:id:${id}`);
    sendWebhook('majors', deleted);
    return deleted;
  }

  async getBatchByIds(ids: string[]) {
    const found = await this.repository.findByIds(ids);
    const foundIds = new Set(found.map((a) => a.id));
    const notFound = ids.filter((id) => !foundIds.has(id));
    return { found, notFound };
  }

  async bulkDelete(ids: string[]) {
    return prisma.$transaction(async (tx) => {
      const items = await tx.major.findMany({ where: { id: { in: ids }, deletedAt: null } });
      if (items.length !== ids.length) throw new NotFoundError('Beberapa data tidak ditemukan');
      
      const classes = await tx.class.findFirst({ where: { majorId: { in: ids }, deletedAt: null } });
      if (classes) throw new BadRequestError('Cannot delete Major because it still has active Classes.');
      
      await tx.major.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
      
      const deletedItems = await tx.major.findMany({ where: { id: { in: ids } } });
      await clearCachePattern('major:all:*');
      for (const item of deletedItems) {
        await clearCachePattern(`major:id:${item.id}`);
        sendWebhook('majors', item);
      }
      
      return true;
    });
  }
}

export const majorService = new MajorService(majorRepository);
