import { SubjectTeacherRepository, subjectTeacherRepository } from '../repository';
import { NotFoundError } from '@/errors';
import type { WebhookSubjectTeacherDto } from '../domain/schemas';

export class SubjectTeacherService {
  constructor(private repository: SubjectTeacherRepository) {}

  async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.repository.findAll(skip, limit);
    return { data, total: data.length };
  }

  async getById(id: string) {
    const data = await this.repository.findById(id);
    if (!data) throw new NotFoundError('Data tidak ditemukan');
    return data;
  }

  async upsertFromWebhook(items: WebhookSubjectTeacherDto[]) {
    let count = 0;
    for (const item of items) {
      // Remove id from the payload so we can upsert safely, mapping dates if needed
      const { id, ...rest } = item;
      
      const payload: any = { ...rest };
      
      delete payload.subject;
      delete payload.teacher;

      if (payload.createdAt) payload.createdAt = new Date(payload.createdAt);
      if (payload.updatedAt) payload.updatedAt = new Date(payload.updatedAt);
      if (payload.deletedAt) payload.deletedAt = new Date(payload.deletedAt);
      payload.lastSyncAt = new Date();

      await this.repository.upsert(id, payload);
      count++;
    }
    return { upserted: count };
  }
}

export const subjectTeacherService = new SubjectTeacherService(subjectTeacherRepository);
