import { ApplicationRepository, applicationRepository } from '#master/modules/application/repository';
import { CreateApplicationDto, UpdateApplicationDto } from '#master/modules/application/domain';
import { BadRequestError, NotFoundError, generateExcelTemplate, parseExcel, buildHeaderLabelMap, type HeaderSpec } from '#app';
import { prisma } from '#master/database/index.js';
import { withCache, clearCachePattern, setCache } from '#app';

const APPLICATION_EXCEL_HEADERS: HeaderSpec[] = [
  { label: 'Urutan', key: 'order' },
  { label: 'Judul', key: 'title' },
  { label: 'Deskripsi', key: 'description' },
  { label: 'Ikon', key: 'materialIcon' },
  { label: 'Tautan', key: 'link' },
];

export class ApplicationService {
  constructor(private repository: ApplicationRepository) {}

  async getAll(page: number, limit: number) {
    return withCache(`application:all:page:${page}:limit:${limit}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit),
        this.repository.count(),
      ]);
      return { data, total };
    });
  }

  async getById(id: string) {
    return withCache(`application:id:${id}`, 600, async () => {
      const item = await this.repository.findById(id);
      if (!item) throw new NotFoundError('Aplikasi tidak ditemukan');
      return item;
    });
  }

  async create(data: CreateApplicationDto) {
    // Auto-fill `order` when caller omits it: place after the current max.
    // NOTE: simple read-then-write race; for admin low-traffic this is fine.
    // If two admins create concurrently, both may get the same order value
    // — duplicates are intentionally allowed (no DB unique constraint).
    let payload = data;
    if (data.order === undefined) {
      const max = await this.repository.getMaxOrder();
      payload = { ...data, order: max + 1 };
    }
    const created = await this.repository.create(payload);
    await clearCachePattern('application:all:*');
    await setCache(`application:id:${created.id}`, created, 600);
    return created;
  }

  async update(id: string, data: UpdateApplicationDto) {
    await this.getById(id);
    const updated = await this.repository.update(id, data);
    await clearCachePattern('application:all:*');
    await setCache(`application:id:${id}`, updated, 600);
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern('application:all:*');
    await clearCachePattern(`application:id:${id}`);
    return deleted;
  }

  /**
   * Bulk insert applications WITHOUT a database transaction.
   * Per-row try/catch so a single failure does not abort the rest.
   */
  async bulkCreate(data: { title: string; description: string; materialIcon: string; link: string; order?: number }[]) {
    type Row = { title: string; description: string; materialIcon: string; link: string; order?: number };
    const failedRows: Array<Record<string, unknown> & { reason: string }> = [];
    const candidates: Row[] = [];

    // Phase 1: required-field validation + order guard (mirrors Zod's `int().min(0)`
    // for the Excel path which doesn't go through `validate(createApplicationSchema)`)
    for (const item of data) {
      if (!item.title || !item.description || !item.materialIcon || !item.link) {
        failedRows.push({ ...item, reason: 'Field title, description, materialIcon, dan link harus diisi' });
        continue;
      }
      if (item.order !== undefined && (!Number.isInteger(item.order) || item.order < 0)) {
        failedRows.push({ ...item, reason: 'Nilai Urutan harus berupa bilangan bulat >= 0' });
        continue;
      }
      candidates.push(item);
    }

    // Phase 2 (auto-fill): for rows without explicit `order`, increment from
    // baseline (current max+1). Rows with explicit order pass through.
    // Captured baseline ONCE before the loop (D.3 hybrid strategy).
    let nextAutoOrder: number | null = null;
    const hasAnyEmpty = candidates.some((c) => c.order === undefined);
    if (hasAnyEmpty) {
      const baseline = await this.repository.getMaxOrder();
      nextAutoOrder = baseline + 1;
    }
    for (const item of candidates) {
      if (item.order === undefined && nextAutoOrder !== null) {
        item.order = nextAutoOrder++;
      }
    }

    // Phase 3: per-row insert (no transaction)
    const successRows: Array<{
      id: string;
      title: string;
      description: string;
      materialIcon: string;
      link: string;
      order: number | null;
    }> = [];
    for (const item of candidates) {
      try {
        const created = await prisma.application.create({ data: item });
        successRows.push(created as {
          id: string;
          title: string;
          description: string;
          materialIcon: string;
          link: string;
          order: number | null;
        });
      } catch (err: any) {
        failedRows.push({ ...item, reason: err?.message ?? 'Database insert error' });
      }
    }

    // Phase 4: cache invalidation if any succeeded
    if (successRows.length > 0) {
      await clearCachePattern('application:all:*');
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
      const items = await tx.application.findMany({ where: { id: { in: ids }, deletedAt: null } });
      if (items.length !== ids.length) throw new NotFoundError('Beberapa data tidak ditemukan');

      await tx.application.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });

      await clearCachePattern('application:all:*');
      for (const item of items) {
        await clearCachePattern(`application:id:${item.id}`);
      }

      return true;
    });
  }

  async getExcelTemplate(): Promise<Buffer> {
    return generateExcelTemplate(
      APPLICATION_EXCEL_HEADERS,
      'Applications',
      {
        order: 1,
        title: 'Sistem Informasi Akademik',
        description: 'Aplikasi pengelolaan data akademik',
        materialIcon: 'school',
        link: 'https://akademik.example.com',
      },
    );
  }

  async bulkCreateFromExcel(buffer: Buffer) {
    // parseExcel produces strings for every cell, so RawRow.order is `string`.
    type RawRow = { title?: string; description?: string; materialIcon?: string; link?: string; order?: string };
    const rows = await parseExcel<RawRow>(
      buffer,
      ['title'],
      buildHeaderLabelMap(APPLICATION_EXCEL_HEADERS),
    );
    return this.bulkCreate(
      rows.map((r) => {
        // Trim and convert order cell. Leave undefined for blank cells so
        // bulkCreate auto-fills with the next sequence value. The integer/min
        // guard in bulkCreate will reject non-numeric or negative values
        // with a per-row `failedRows` entry.
        const orderText = (r.order ?? '').toString().trim();
        let order: number | undefined;
        if (orderText !== '') {
          const parsed = Number(orderText);
          if (Number.isFinite(parsed)) order = parsed; // NaN propagates as raw number; bulkCreate guard fails it
        }
        return {
          title: String(r.title ?? ''),
          description: String(r.description ?? ''),
          materialIcon: String(r.materialIcon ?? ''),
          link: String(r.link ?? ''),
          order,
        };
      }),
    );
  }
}

export const applicationService = new ApplicationService(applicationRepository);
