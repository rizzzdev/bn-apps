import { MajorRepository, majorRepository } from '@/modules/major/repository';
import { CreateMajorDto, UpdateMajorDto } from '@/modules/major/domain';
import { BadRequestError, NotFoundError } from '@/errors';
import { prisma } from '@/database';
import { withCache, clearCachePattern, setCache } from '@/utils/cache';

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
    return created;
  }

  async update(id: string, data: UpdateMajorDto) {
    await this.getById(id);
    await this.validateUnique(data, id);
    const updated = await this.repository.update(id, data);
    await clearCachePattern('major:all:*');
    await setCache(`major:id:${id}`, updated, 600);
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    const classes = await prisma.class.findFirst({ where: { majorId: id, deletedAt: null } });
    if (classes) throw new BadRequestError('Cannot delete Major because it still has active Classes.');
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern('major:all:*');
    await clearCachePattern(`major:id:${id}`);
    return deleted;
  }

  async bulkCreate(data: { code: string; name: string }[]) {
    const uniqueData = [];
    const seenCodes = new Set<string>();
    const seenNames = new Set<string>();
    const failedRows = [];

    for (const item of data) {
      if (!item.code || !item.name) {
        failedRows.push({ ...item, reason: 'Kode atau Nama kosong' });
        continue;
      }
      if (seenCodes.has(item.code) || seenNames.has(item.name)) {
        failedRows.push({ ...item, reason: 'Duplikat kode/nama di dalam file' });
        continue;
      }
      seenCodes.add(item.code);
      seenNames.add(item.name);
      uniqueData.push(item);
    }

    if (uniqueData.length > 0) {
      const existingCodes = await prisma.major.findMany({
        where: { code: { in: uniqueData.map(d => d.code) }, deletedAt: null },
        select: { code: true }
      });
      const existingNames = await prisma.major.findMany({
        where: { name: { in: uniqueData.map(d => d.name) }, deletedAt: null },
        select: { name: true }
      });

      const existingCodeSet = new Set(existingCodes.map(c => c.code));
      const existingNameSet = new Set(existingNames.map(n => n.name));

      const toInsert = [];
      for (const item of uniqueData) {
        if (existingCodeSet.has(item.code)) {
          failedRows.push({ ...item, reason: 'Kode sudah ada di database' });
        } else if (existingNameSet.has(item.name)) {
          failedRows.push({ ...item, reason: 'Nama sudah ada di database' });
        } else {
          toInsert.push(item);
        }
      }

      if (toInsert.length > 0) {
        await prisma.major.createMany({ data: toInsert });

        await clearCachePattern('major:all:*');

        const inserted = await prisma.major.findMany({
          where: { code: { in: toInsert.map(i => i.code) }, deletedAt: null }
        });

        for (const item of inserted) {
          await setCache(`major:id:${item.id}`, item, 600);
        }

        return { successCount: toInsert.length, failedRows };
      }
    }

    return { successCount: 0, failedRows };
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
      }

      return true;
    });
  }
}

export const majorService = new MajorService(majorRepository);
