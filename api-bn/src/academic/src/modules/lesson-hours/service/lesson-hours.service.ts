import { lessonHourRepository } from '@academic/modules/lesson-hours/repository';
import type { LessonHourRepository } from '@academic/modules/lesson-hours/repository';
import { NotFoundError } from '@app/index.js';
import type { CreateLessonHourDto, UpdateLessonHourDto } from '@academic/modules/lesson-hours/domain';

export class LessonHourService {
  constructor(private repository: LessonHourRepository) {}

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
    if (!item) throw new NotFoundError('Jam pelajaran tidak ditemukan');
    return item;
  }

  async create(data: CreateLessonHourDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: UpdateLessonHourDto) {
    await this.getById(id);
    return this.repository.update(id, data as any);
  }

  async delete(id: string) {
    await this.getById(id);
    await this.repository.softDelete(id);
  }

  async deleteBulk(ids: string[]) {
    const { count } = await this.repository.softDeleteMany(ids);
    return { deleted: count };
  }

  async updateStatusBulk(ids: string[], status: string) {
    const { count } = await this.repository.updateStatusMany(ids, status);
    return { updated: count };
  }
}

export const lessonHoursService = new LessonHourService(lessonHourRepository);
