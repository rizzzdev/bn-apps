import { SemesterRepository, semesterRepository } from '@/modules/semester/repository';
import { CreateSemesterDto, UpdateSemesterDto } from '@/modules/semester/domain';
import { BadRequestError, NotFoundError } from '@/errors';
import { prisma } from '@/database';
import { withCache, clearCachePattern, setCache } from '@/utils/cache';

export class SemesterService {
  constructor(private repository: SemesterRepository) {}

  async getAll(page: number, limit: number, includeAcademicYear: boolean = false) {
    return withCache(`semester:all:page:${page}:limit:${limit}:academicYear:${includeAcademicYear}`, 600, async () => {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.repository.findAll(skip, limit, includeAcademicYear),
        this.repository.count()
      ]);
      return { data, total };
    });
  }

  async getById(id: string, includeAcademicYear: boolean = false) {
    return withCache(`semester:id:${id}:academicYear:${includeAcademicYear}`, 600, async () => {
      const item = await this.repository.findById(id, includeAcademicYear);
      if (!item) throw new NotFoundError('Semester tidak ditemukan');
      return item;
    });
  }

  async validateUnique(data: Partial<CreateSemesterDto>, existingItem?: import('@/database/generated/client').Semester) {
    const checkType = data.type || existingItem?.type;
    const checkYearId = data.academicYearId || existingItem?.academicYearId;

    if (checkType && checkYearId) {
      const exists = await this.repository.checkUniqueType(checkType, checkYearId, existingItem?.id);
      if (exists) throw new BadRequestError('Semester type already exists for this academic year');
    }

    if (data.status === 'Aktif') {
      const activeExists = await this.repository.checkActiveStatus(existingItem?.id);
      if (activeExists) throw new BadRequestError('An active semester already exists');
    }

    if (checkYearId) {
      const ay = await prisma.academicYear.findFirst({ where: { id: checkYearId, deletedAt: null } });
      if (!ay) throw new BadRequestError('Tahun ajaran tidak ditemukan atau telah dihapus');
    }
  }

  async create(data: CreateSemesterDto) {
    await this.validateUnique(data);
    const created = await this.repository.create(data);
    await clearCachePattern('semester:all:*');
    await clearCachePattern('academic-year:all:*');
    await clearCachePattern(`academic-year:id:${created.academicYearId}`);
    await setCache(`semester:id:${created.id}`, created, 600);
    return created;
  }

  async update(id: string, data: UpdateSemesterDto) {
    const item = await this.getById(id);
    await this.validateUnique(data, item);
    const updated = await this.repository.update(id, data);
    await clearCachePattern('semester:all:*');
    await clearCachePattern('academic-year:all:*');
    if (item.academicYearId) await clearCachePattern(`academic-year:id:${item.academicYearId}`);
    if (data.academicYearId && data.academicYearId !== item.academicYearId) await clearCachePattern(`academic-year:id:${data.academicYearId}`);
    await setCache(`semester:id:${id}`, updated, 600);
    return updated;
  }

  async delete(id: string) {
    const item = await this.getById(id);
    const deleted = await this.repository.softDelete(id);
    await clearCachePattern('semester:all:*');
    await clearCachePattern(`semester:id:${id}`);
    await clearCachePattern('academic-year:all:*');
    await clearCachePattern(`academic-year:id:${item.academicYearId}`);
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
      const items = await tx.semester.findMany({ where: { id: { in: ids }, deletedAt: null } });
      if (items.length !== ids.length) throw new NotFoundError('Beberapa data tidak ditemukan');
      await tx.semester.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });

      const deletedItems = await tx.semester.findMany({ where: { id: { in: ids } } });
      await clearCachePattern('semester:all:*');
      await clearCachePattern('academic-year:all:*');
      for (const item of deletedItems) {
        await clearCachePattern(`semester:id:${item.id}`);
        await clearCachePattern(`academic-year:id:${item.academicYearId}`);
      }

      return true;
    });
  }
}

export const semesterService = new SemesterService(semesterRepository);
