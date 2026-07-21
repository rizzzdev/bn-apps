import { TeacherRepository, teacherRepository } from '@/modules/teachers/repository';
import { NotFoundError } from '@/errors';
import type { WebhookTeacherDto } from '@/modules/teachers/domain';

export class TeacherService {
  constructor(private repository: TeacherRepository) {}

  async getAll(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, limit, status),
      this.repository.count(status),
    ]);
    return { data, total };
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Teacher tidak ditemukan');
    return item;
  }

  async upsertFromWebhook(items: WebhookTeacherDto[]) {
    for (const item of items) {
      await this.repository.upsert(item.id, {
        fullname: item.fullname,
        prefixTitle: item.prefixTitle ?? null,
        suffixTitle: item.suffixTitle ?? null,
        gender: item.gender ?? null,
        nip: item.nip ?? null,
        email: item.email ?? null,
        userId: item.userId,
        pictureUrl: item?.picture?.url ?? item?.pictureUrl ?? null,
        status: item.status ?? 'Aktif',
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
        lastSyncAt: new Date(),
      });
    }
    return { upserted: items.length };
  }
}

export const teachersService = new TeacherService(teacherRepository);
