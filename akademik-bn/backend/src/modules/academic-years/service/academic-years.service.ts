import { AcademicYearRepository, academicYearRepository } from '@/modules/academic-years/repository';
import { BadRequestError, NotFoundError } from '@/errors';
import type { WebhookAcademicYearDto } from '@/modules/academic-years/domain';

export class AcademicYearService {
  constructor(private repository: AcademicYearRepository) {}

  async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, limit),
      this.repository.count(),
    ]);
    return { data, total };
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Academic year tidak ditemukan');
    return item;
  }

  async findActive() {
    const item = await this.repository.findActive();
    if (!item) throw new NotFoundError('Tidak ada academic year aktif');
    return item;
  }

  async upsertFromWebhook(items: WebhookAcademicYearDto[]) {
    const activeItems = items.filter((item) => item.status === 'Aktif');
    if (activeItems.length === 0) return { upserted: 0 };

    const activeYear = activeItems[0];
    if (!activeYear) return { upserted: 0 };

    const activeSemester = activeYear.semesters?.find((s) => s.status === 'Aktif');
    if (!activeSemester) throw new BadRequestError('Tidak ada semester aktif dalam data academic year');

    await this.repository.deactivateOldActive(activeYear.id);

    await this.repository.upsert(activeYear.id, {
      code: activeYear.code,
      semesterType: activeSemester.type,
      status: 'Aktif',
      createdAt: new Date(activeYear.createdAt),
      updatedAt: new Date(activeYear.updatedAt),
      deletedAt: activeYear.deletedAt ? new Date(activeYear.deletedAt) : null,
      lastSyncAt: new Date(),
    });

    return { upserted: 1 };
  }
}

export const academicYearsService = new AcademicYearService(academicYearRepository);
