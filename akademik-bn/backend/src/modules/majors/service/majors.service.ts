import { MajorRepository, majorRepository } from '@/modules/majors/repository';
import { NotFoundError } from '@/errors';
import type { WebhookMajorDto } from '@/modules/majors/domain';

export class MajorService {
  constructor(private repository: MajorRepository) {}

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
    if (!item) throw new NotFoundError('Major tidak ditemukan');
    return item;
  }

  async upsertFromWebhook(items: WebhookMajorDto[]) {
    for (const item of items) {
      await this.repository.upsert(item.id, {
        code: item.code,
        name: item.name,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
        lastSyncAt: new Date(),
      });
    }
    return { upserted: items.length };
  }
}

export const majorsService = new MajorService(majorRepository);
