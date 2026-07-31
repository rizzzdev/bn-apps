import { ClassRepository, classRepository } from '@master/modules/class/repository';
import { CreateClassDto, UpdateClassDto } from '@master/modules/class/domain';
import { BadRequestError, NotFoundError, generateExcelTemplate, parseExcel, buildHeaderLabelMap, type HeaderSpec } from '@app/index.js';
import { prisma } from '@master/database/index.js';
import { withCache, clearCachePattern, setCache } from '@app/index.js';

const CLASS_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Nama Kelas', key: 'name' },
  { label: 'Kode Jurusan', key: 'majorCode' },
];

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

  /**
   * Bulk insert classes WITHOUT a database transaction.
   * Per-row try/catch so a single failure does not abort the rest.
   * Each row requires a valid majorCode mapped to an existing majorId.
   */
  async bulkCreate(data: { name: string; majorCode: string }[]) {
    type FinalRow = { name: string; majorId: string };
    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const seenName = new Set<string>();
    const lightCandidates: Array<{ name: string; majorCode: string }> = [];

    // Phase 1: in-file dedupe & required-field validation
    for (const item of data) {
      if (!item.name || !item.majorCode) {
        failedRows.push({ ...item, reason: 'Nama Kelas atau Kode Jurusan kosong' });
        continue;
      }
      if (seenName.has(item.name)) {
        failedRows.push({ ...item, reason: 'Duplikat nama kelas di dalam file' });
        continue;
      }
      seenName.add(item.name);
      lightCandidates.push(item);
    }

    const candidates: FinalRow[] = [];

    // Phase 2: lookup majors by code + check name uniqueness in DB
    if (lightCandidates.length > 0) {
      const uniqueMajorCodes = Array.from(new Set(lightCandidates.map((d) => d.majorCode)));
      const existingMajors = await prisma.major.findMany({
        where: { code: { in: uniqueMajorCodes }, deletedAt: null },
        select: { id: true, code: true },
      });
      const majorMap = new Map(existingMajors.map((m) => [m.code, m.id]));

      // Batch check duplicate class names already in DB
      const existingClasses = await prisma.class.findMany({
        where: { name: { in: lightCandidates.map((d) => d.name) }, deletedAt: null },
        select: { name: true },
      });
      const existingNameSet = new Set(existingClasses.map((c) => c.name));

      for (const item of lightCandidates) {
        const majorId = majorMap.get(item.majorCode);
        if (!majorId) {
          failedRows.push({ ...item, reason: 'Kode Jurusan tidak ditemukan atau dihapus' });
        } else if (existingNameSet.has(item.name)) {
          failedRows.push({ ...item, reason: 'Nama Kelas sudah ada di database' });
        } else {
          candidates.push({ name: item.name, majorId });
        }
      }
    }

    // Phase 3: per-row insert (no transaction)
    const successRows: Array<{ id: string; name: string; majorId: string }> = [];
    for (const item of candidates) {
      try {
        const created = await prisma.class.create({ data: item });
        successRows.push(created as { id: string; name: string; majorId: string });
      } catch (err: any) {
        failedRows.push({ ...item, reason: err?.message ?? 'Database insert error' });
      }
    }

    // Phase 4: cache invalidation if any succeeded
    if (successRows.length > 0) {
      await clearCachePattern('class:all:*');
      for (const item of successRows) {
        await setCache(`class:id:${item.id}`, item, 600);
      }
    }

    return {
      createdItems: successRows,
      successCount: successRows.length,
      successRows,
      failedRows,
    };
  }

  async getExcelTemplate(): Promise<Buffer> {
    return generateExcelTemplate(
      CLASS_EXCEL_HEADERS,
      'Classes',
      { name: '10 RPL 1', majorCode: 'RPL' },
    );
  }

  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = { name?: string; majorCode?: string };
    const rows = await parseExcel<RawRow>(
      buffer,
      ['name', 'majorCode'],
      buildHeaderLabelMap(CLASS_EXCEL_HEADERS),
    );
    return this.bulkCreate(
      rows.map((r) => ({ name: String(r.name ?? ''), majorCode: String(r.majorCode ?? '') })),
    );
  }
}

export const classService = new ClassService(classRepository);
