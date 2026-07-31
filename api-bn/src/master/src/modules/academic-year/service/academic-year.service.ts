import { AcademicYearRepository, academicyearRepository } from '@master/modules/academic-year/repository';
import { CreateAcademicYearDto, UpdateAcademicYearDto } from '@master/modules/academic-year/domain';
import { BadRequestError, NotFoundError } from '@app/index.js';
import { prisma } from '@master/database/index.js';
import { withCache, clearCachePattern, setCache } from '@app/index.js';

export class AcademicYearService {
  constructor(private repository: AcademicYearRepository) {}

  async getAll(page: number, limit: number, includeSemesters: boolean = false) {
    return withCache(`academic-year:all:page:${page}:limit:${limit}:semesters:${includeSemesters}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, includeSemesters),
        this.repository.count()
      ]);
      return { data, total };
    });
  }

  async getById(id: string, includeSemesters: boolean = false) {
    return withCache(`academic-year:id:${id}:semesters:${includeSemesters}`, 600, async () => {
      const item = await this.repository.findById(id, includeSemesters);
      if (!item) throw new NotFoundError('AcademicYear not found');
      return item;
    });
  }

  async validateUnique(data: Partial<CreateAcademicYearDto>, excludeId?: string) {
    if (data.code) {
      const exists = await this.repository.checkUnique('code', data.code, excludeId);
      if (exists) throw new BadRequestError('Academic year code already exists');
    }
  }

  /**
   * If creating a new "Aktif" year while one already exists, auto-rollover
   * (deactivate) the prior active row by setting its status to "Selesai".
   * This enforces the invariant: at most ONE row has status "Aktif".
   */
  private async rolloverActiveAY(excludeId?: string) {
    await prisma.academicYear.updateMany({
      where: {
        status: 'Aktif',
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { status: 'Selesai' },
    });
  }

  async create(data: CreateAcademicYearDto) {
    if (!data.endYear) {
      data.endYear = data.startYear + 1;
    }
    if (data.endYear !== data.startYear + 1) {
      throw new BadRequestError('Tahun Selesai harus tepat 1 tahun setelah Tahun Mulai');
    }
    // Only auto-generate code if not explicitly provided (allows custom codes in tests)
    if (!data.code) {
      data.code = `${data.startYear}/${data.endYear}`;
    }
    await this.validateUnique(data);

    if (data.status === 'Aktif') {
      await this.rolloverActiveAY();
    }

    const created = await this.repository.create(data);
    await clearCachePattern('academic-year:all:*');
    await setCache(`academic-year:id:${created.id}`, created, 600);
    return created;
  }

  async update(id: string, data: UpdateAcademicYearDto) {
    const item = await this.getById(id);
    const currentStartYear = data.startYear || item.startYear;
    const currentEndYear = data.endYear || item.endYear;

    if (currentEndYear !== currentStartYear + 1) {
      throw new BadRequestError('Tahun Selesai harus tepat 1 tahun setelah Tahun Mulai');
    }

    if (data.startYear || data.endYear) {
      data.code = `${currentStartYear}/${currentEndYear}`;
    }
    await this.validateUnique(data, id);

    if (data.status === 'Aktif') {
      await this.rolloverActiveAY(id);
    }

    const updated = await this.repository.update(id, data);
    await clearCachePattern('academic-year:all:*');
    await setCache(`academic-year:id:${id}`, updated, 600);
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    const semesters = await prisma.semester.findFirst({ where: { academicYearId: id, deletedAt: null } });
    if (semesters) throw new BadRequestError('Cannot delete Academic Year because it still has active Semesters.');
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern('academic-year:all:*');
    await clearCachePattern(`academic-year:id:${id}`);
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
      const items = await tx.academicYear.findMany({ where: { id: { in: ids }, deletedAt: null } });
      if (items.length !== ids.length) throw new NotFoundError('Beberapa data tidak ditemukan');

      const semesters = await tx.semester.findFirst({ where: { academicYearId: { in: ids }, deletedAt: null } });
      if (semesters) throw new BadRequestError('Cannot delete Academic Year because it still has active Semesters.');

      await tx.academicYear.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });

      const deletedItems = await tx.academicYear.findMany({ where: { id: { in: ids } } });
      await clearCachePattern('academic-year:all:*');
      for (const item of deletedItems) {
        await clearCachePattern(`academic-year:id:${item.id}`);
      }

      return true;
    });
  }
}

export const academicyearService = new AcademicYearService(academicyearRepository);
