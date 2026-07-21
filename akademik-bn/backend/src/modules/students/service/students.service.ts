import { StudentRepository, studentRepository } from '@/modules/students/repository';
import { NotFoundError } from '@/errors';
import type { WebhookStudentDto } from '@/modules/students/domain';

export class StudentService {
  constructor(private repository: StudentRepository) {}

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
    if (!item) throw new NotFoundError('Student tidak ditemukan');
    return item;
  }

  async upsertFromWebhook(items: WebhookStudentDto[]) {
    for (const item of items) {
      await this.repository.upsert(item.id, {
        fullname: item.fullname,
        gender: item.gender ?? null,
        nis: item.nis ?? null,
        nisn: item.nisn ?? null,
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

export const studentsService = new StudentService(studentRepository);
