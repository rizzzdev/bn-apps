import { ClassRepository, classRepository } from '@/modules/classes/repository';
import { NotFoundError } from '@/errors';
import type { WebhookClassDto } from '@/modules/classes/domain';

export class ClassService {
  constructor(private repository: ClassRepository) {}

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
    if (!item) throw new NotFoundError('Class tidak ditemukan');
    return item;
  }

  async upsertFromWebhook(items: WebhookClassDto[]) {
    for (const item of items) {
      await this.repository.upsert(item.id, {
        name: item.name,
        majorId: item.majorId,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
        lastSyncAt: new Date(),
      });
    }
    return { upserted: items.length };
  }
}

export const classesService = new ClassService(classRepository);
