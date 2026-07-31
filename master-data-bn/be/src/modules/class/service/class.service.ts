import { ClassRepository, classRepository } from '@/modules/class/repository';
import { CreateClassDto, UpdateClassDto } from '@/modules/class/domain';
import { BadRequestError, NotFoundError } from '@/errors';
import { prisma } from '@/database';
import { withCache, clearCachePattern, setCache } from '@/utils/cache';

export class ClassService {
  constructor(private repository: ClassRepository) {}

  async getAll(page: number, limit: number, includeMajor: boolean = false, includeCurrentStudent: boolean = false) {
    return withCache(`class:all:page:${page}:limit:${limit}:includeMajor:${includeMajor}:includeCurrentStudent:${includeCurrentStudent}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, includeMajor, includeCurrentStudent),
        this.repository.count()
      ]);
      return { data, total };
    });
  }

  async getById(id: string, includeMajor: boolean = false, includeCurrentStudent: boolean = false) {
    return withCache(`class:id:${id}:includeMajor:${includeMajor}:includeCurrentStudent:${includeCurrentStudent}`, 600, async () => {
      const item = await this.repository.findById(id, includeMajor, includeCurrentStudent);
      if (!item) throw new NotFoundError('Kelas tidak ditemukan');
      return item;
    });
  }

  async validateUnique(data: Partial<CreateClassDto>, excludeId?: string) {
    if (data.name) {
      const exists = await this.repository.checkUnique('name', data.name, excludeId);
      if (exists) throw new BadRequestError('Class name already exists');
    }
    if (data.majorId) {
      const major = await prisma.major.findFirst({ where: { id: data.majorId, deletedAt: null } });
      if (!major) throw new BadRequestError('Jurusan tidak ditemukan atau telah dihapus');
    }
  }

  async create(data: CreateClassDto) {
    await this.validateUnique(data);
    const created = await this.repository.create(data);
    await clearCachePattern('class:all:*');
    await setCache(`class:id:${created.id}`, created, 600);
    return created;
  }

  async update(id: string, data: UpdateClassDto) {
    await this.getById(id);
    await this.validateUnique(data, id);
    const updated = await this.repository.update(id, data);
    await clearCachePattern('class:all:*');
    await setCache(`class:id:${id}`, updated, 600);
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern('class:all:*');
    await clearCachePattern(`class:id:${id}`);
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
      const items = await tx.class.findMany({ where: { id: { in: ids }, deletedAt: null } });
      if (items.length !== ids.length) throw new NotFoundError('Beberapa data tidak ditemukan');
      await tx.class.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });

      const deletedItems = await tx.class.findMany({ where: { id: { in: ids } } });
      await clearCachePattern('class:all:*');
      for (const item of deletedItems) {
        await clearCachePattern(`class:id:${item.id}`);
      }

      return true;
    });
  }

  async bulkCreate(data: { name: string; majorCode: string }[]) {
    const uniqueData = [];
    const seenNames = new Set<string>();
    const failedRows = [];

    for (const item of data) {
      if (!item.name || !item.majorCode) {
        failedRows.push({ ...item, reason: 'Nama Kelas atau Kode Jurusan kosong' });
        continue;
      }
      if (seenNames.has(item.name)) {
        failedRows.push({ ...item, reason: 'Duplikat nama kelas di dalam file' });
        continue;
      }
      seenNames.add(item.name);
      uniqueData.push(item);
    }

    if (uniqueData.length > 0) {
      const uniqueMajorCodes = Array.from(new Set(uniqueData.map((d) => d.majorCode)));
      const existingMajors = await prisma.major.findMany({
        where: { code: { in: uniqueMajorCodes }, deletedAt: null },
        select: { id: true, code: true }
      });
      const majorMap = new Map(existingMajors.map((m) => [m.code, m.id]));

      const existingClasses = await prisma.class.findMany({
        where: { name: { in: uniqueData.map((d) => d.name) }, deletedAt: null },
        select: { name: true }
      });
      const existingNameSet = new Set(existingClasses.map((c) => c.name));

      const toInsert = [];
      for (const item of uniqueData) {
        const majorId = majorMap.get(item.majorCode);
        if (!majorId) {
          failedRows.push({ ...item, reason: 'Kode Jurusan tidak ditemukan atau dihapus' });
        } else if (existingNameSet.has(item.name)) {
          failedRows.push({ ...item, reason: 'Nama Kelas sudah ada di database' });
        } else {
          toInsert.push({ name: item.name, majorId });
        }
      }

      if (toInsert.length > 0) {
        await prisma.class.createMany({ data: toInsert });
        await clearCachePattern('class:all:*');

        const inserted = await prisma.class.findMany({
          where: { name: { in: toInsert.map((i) => i.name) }, deletedAt: null }
        });

        for (const item of inserted) {
          await setCache(`class:id:${item.id}`, item, 600);
        }

        return { successCount: toInsert.length, failedRows };
      }
    }

    return { successCount: 0, failedRows };
  }
}

export const classService = new ClassService(classRepository);
