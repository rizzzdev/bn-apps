import { SubjectRepository, subjectRepository } from '@/modules/subjects/repository';
import { NotFoundError } from '@/errors';
import type { WebhookSubjectDto } from '@/modules/subjects/domain';

export class SubjectService {
  constructor(private repository: SubjectRepository) {}

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
    if (!item) throw new NotFoundError('Subject tidak ditemukan');
    return item;
  }

  async upsertFromWebhook(items: WebhookSubjectDto[]) {
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

export const subjectsService = new SubjectService(subjectRepository);
