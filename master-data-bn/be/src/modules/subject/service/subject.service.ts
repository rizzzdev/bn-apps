import { SubjectRepository, subjectRepository } from '@/modules/subject/repository';
import { CreateSubjectDto, UpdateSubjectDto } from '@/modules/subject/domain';
import { BadRequestError, NotFoundError } from '@/errors';
import { prisma } from '@/database';
import { withCache, clearCachePattern, setCache } from '@/utils/cache';
import { sendWebhook } from '@/utils/webhook';

export class SubjectService {
  constructor(private repository: SubjectRepository) {}

  async getAll(page: number, limit: number) {
    return withCache(`subject:all:page:${page}:limit:${limit}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit),
        this.repository.count()
      ]);
      return { data, total };
    });
  }

  async getById(id: string) {
    return withCache(`subject:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Mata Pelajaran tidak ditemukan');
      return item;
    });
  }

  async validateUnique(data: Partial<CreateSubjectDto>, excludeId?: string) {
    if (data.code) {
      const exists = await this.repository.checkUnique('code', data.code, excludeId);
      if (exists) throw new BadRequestError('Subject code already exists');
    }
    if (data.name) {
      const exists = await this.repository.checkUnique('name', data.name, excludeId);
      if (exists) throw new BadRequestError('Subject name already exists');
    }
  }

  async create(data: CreateSubjectDto) {
    await this.validateUnique(data);
    const created = await this.repository.create(data);
    await clearCachePattern('subject:all:*');
    await setCache(`subject:id:${created.id}`, created, 600);
    sendWebhook('subjects', created);
    return created;
  }

  async update(id: string, data: UpdateSubjectDto) {
    await this.getById(id);
    await this.validateUnique(data, id);
    const updated = await this.repository.update(id, data);
    await clearCachePattern('subject:all:*');
    await setCache(`subject:id:${id}`, updated, 600);
    sendWebhook('subjects', updated);
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern('subject:all:*');
    await clearCachePattern(`subject:id:${id}`);
    sendWebhook('subjects', deleted);
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
      const items = await tx.subject.findMany({ where: { id: { in: ids }, deletedAt: null } });
      if (items.length !== ids.length) throw new NotFoundError('Beberapa data tidak ditemukan');
      await tx.subject.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
      
      const deletedItems = await tx.subject.findMany({ where: { id: { in: ids } } });
      await clearCachePattern('subject:all:*');
      for (const item of deletedItems) {
        await clearCachePattern(`subject:id:${item.id}`);
        sendWebhook('subjects', item);
      }
      
      return true;
    });
  }
}

export const subjectService = new SubjectService(subjectRepository);
