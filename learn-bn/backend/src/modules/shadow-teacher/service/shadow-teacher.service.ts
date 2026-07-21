import { TeacherRepository, teacherRepository } from '../repository';
import { NotFoundError } from '@/errors';
import type { WebhookTeacherDto } from '../domain/schemas';

export class TeacherService {
  constructor(private repository: TeacherRepository) {}

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

  async upsertFromWebhook(items: WebhookTeacherDto[]) {
    let count = 0;
    for (const item of items) {
      // Remove id from the payload so we can upsert safely, mapping dates if needed
      const { id } = item;
      
      let pictureUrl = null;
      if (item.pictureUrl) {
        pictureUrl = item.pictureUrl;
      } else if (item.picture?.url) {
        pictureUrl = item.picture.url;
      }
      
      const payload: any = {
        fullname: item.fullname,
        gender: item.gender,
        nip: item.nip,
        email: item.email,
        userId: item.userId,
        pictureUrl: pictureUrl,
        status: item.status,
      };

      if (item.createdAt) payload.createdAt = new Date(item.createdAt);
      if (item.updatedAt) payload.updatedAt = new Date(item.updatedAt);
      if (item.deletedAt) payload.deletedAt = new Date(item.deletedAt);
      payload.lastSyncAt = new Date();

      await this.repository.upsert(id, payload);
      count++;
    }
    return { upserted: count };
  }
}

export const teacherService = new TeacherService(teacherRepository);
