import { SubjectRepository, subjectRepository } from '#master/modules/subject/repository';
import { CreateSubjectDto, UpdateSubjectDto } from '#master/modules/subject/domain';
import { BadRequestError, NotFoundError, generateExcelTemplate, parseExcel, buildHeaderLabelMap, type HeaderSpec } from '#app';
import { prisma } from '#master/database/index.js';
import { withCache, clearCachePattern, setCache } from '#app';

const SUBJECT_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Kode', key: 'code' },
  { label: 'Nama Mata Pelajaran', key: 'name' },
];

export class SubjectService {
  constructor(private repository: SubjectRepository) {}

  async getAll(page: number, limit: number, search?: string) {
    return withCache(`subject:all:page:${page}:limit:${limit}:search:${search || ''}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, search),
        this.repository.count(search)
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
    return created;
  }

  async update(id: string, data: UpdateSubjectDto) {
    await this.getById(id);
    await this.validateUnique(data, id);
    const updated = await this.repository.update(id, data);
    await clearCachePattern('subject:all:*');
    await setCache(`subject:id:${id}`, updated, 600);
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern('subject:all:*');
    await clearCachePattern(`subject:id:${id}`);
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
      }

      return true;
    });
  }

  /**
   * Bulk insert subjects WITHOUT a database transaction.
   * Per-row try/catch so a single failure does not abort the rest.
   * Return shape (additive — legacy FE may read `createdItems`):
   *   {
   *     createdItems: [...] // newly-created records with id (alias of successRows)
   *     successCount: number,
   *     successRows:  [...]
   *     failedRows:   [{ ...originalRow, reason: string }]
   *   }
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

    // Phase 2: pre-check duplicates already present in DB (one findMany per field)
    if (candidates.length > 0) {
      const [existingByCode, existingByName] = await Promise.all([
        prisma.subject.findMany({
          where: { code: { in: candidates.map((c) => c.code) }, deletedAt: null },
          select: { code: true },
        }),
        prisma.subject.findMany({
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

    // Phase 3: per-row insert (no transaction, DB lock stays short)
    const successRows: Array<{ id: string; code: string; name: string }> = [];
    for (const item of candidates) {
      try {
        const created = await prisma.subject.create({ data: item });
        successRows.push(created as { id: string; code: string; name: string });
      } catch (err: any) {
        failedRows.push({ ...item, reason: err?.message ?? 'Database insert error' });
      }
    }

    // Phase 4: cache invalidation only when at least one row succeeded
    if (successRows.length > 0) {
      await clearCachePattern('subject:all:*');
      for (const item of successRows) {
        await setCache(`subject:id:${item.id}`, item, 600);
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
      SUBJECT_EXCEL_HEADERS,
      'Subjects',
      { code: 'MTK', name: 'Matematika' },
      { code: ['MTK', 'BING', 'IPA', 'IPS', 'PKN'] },
    );
  }

  async bulkCreateFromExcel(buffer: Buffer) {
    type RawRow = { code?: string; name?: string };
    const rows = await parseExcel<RawRow>(
      buffer,
      ['code', 'name'],
      buildHeaderLabelMap(SUBJECT_EXCEL_HEADERS),
    );
    return this.bulkCreate(
      rows.map((r) => ({ code: String(r.code ?? ''), name: String(r.name ?? '') })),
    );
  }
}

export const subjectService = new SubjectService(subjectRepository);
