import { MajorRepository, majorRepository } from '@master/modules/major/repository';
import { CreateMajorDto, UpdateMajorDto } from '@master/modules/major/domain';
import { BadRequestError, NotFoundError, generateExcelTemplate, parseExcel, buildHeaderLabelMap, type HeaderSpec } from '@app/index.js';
import { prisma } from '@master/database/index.js';
import { withCache, clearCachePattern, setCache } from '@app/index.js';

const MAJOR_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Kode Jurusan', key: 'code' },
  { label: 'Nama Jurusan', key: 'name' },
];

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

  /**
   * Bulk insert majors WITHOUT a database transaction.
   * Per-row try/catch so a single failure does not abort the rest.
   */
  async bulkCreate(data: { code: string; name: string }[]) {
    type Row = { code: string; name: string };
    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const seenCode = new Set<string>();
    const seenName = new Set<string>();
    const candidates: Row[] = [];

    // Phase 1: in-file dedupe & required-field validation
    for (const item of data) {
      if (!item.code || !item.name) {
        failedRows.push({ ...item, reason: 'Kode atau Nama kosong' });
        continue;
      }
      if (seenCode.has(item.code) || seenName.has(item.name)) {
        failedRows.push({ ...item, reason: 'Duplikat kode/nama di dalam file' });
        continue;
      }
      seenCode.add(item.code);
      seenName.add(item.name);
      candidates.push(item);
    }

    // Phase 2: pre-check duplicates already present in DB
    if (candidates.length > 0) {
      const [existingByCode, existingByName] = await Promise.all([
        prisma.major.findMany({
          where: { code: { in: candidates.map((c) => c.code) }, deletedAt: null },
          select: { code: true },
        }),
        prisma.major.findMany({
          where: { name: { in: candidates.map((c) => c.name) }, deletedAt: null },
          select: { name: true },
        }),
      ]);
      const codeSet = new Set(existingByCode.map((c) => c.code));
      const nameSet = new Set(existingByName.map((n) => n.name));

      const survivors: Row[] = [];
      for (const item of candidates) {
        if (codeSet.has(item.code)) {
          failedRows.push({ ...item, reason: 'Kode sudah ada di database' });
        } else if (nameSet.has(item.name)) {
          failedRows.push({ ...item, reason: 'Nama sudah ada di database' });
        } else {
          survivors.push(item);
        }
      }
      candidates.length = 0;
      candidates.push(...survivors);
    }

    // Phase 3: per-row insert (no transaction)
    const successRows: Array<{ id: string; code: string; name: string }> = [];
    for (const item of candidates) {
      try {
        const created = await prisma.major.create({ data: item });
        successRows.push(created as { id: string; code: string; name: string });
      } catch (err: any) {
        failedRows.push({ ...item, reason: err?.message ?? 'Database insert error' });
      }
    }

    // Phase 4: cache invalidation if any succeeded
    if (successRows.length > 0) {
      await clearCachePattern('major:all:*');
      for (const item of successRows) {
        await setCache(`major:id:${item.id}`, item, 600);
      }
    }

    return {
      createdItems: successRows,
      successCount: successRows.length,
      successRows,
      failedRows,
    };
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

  async getExcelTemplate(): Promise<Buffer> {
    return generateExcelTemplate(
      MAJOR_EXCEL_HEADERS,
      'Majors',
      { code: 'RPL', name: 'Rekayasa Perangkat Lunak' },
      { code: ['RPL', 'TKJ', 'MM', 'AKL'] },
    );
  }

  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = { code?: string; name?: string };
    const rows = await parseExcel<RawRow>(
      buffer,
      ['code', 'name'],
      buildHeaderLabelMap(MAJOR_EXCEL_HEADERS),
    );
    return this.bulkCreate(
      rows.map((r) => ({ code: String(r.code ?? ''), name: String(r.name ?? '') })),
    );
  }
}

export const majorService = new MajorService(majorRepository);
