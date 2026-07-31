import { TeacherPicketScheduleRepository, teacherPicketScheduleRepository } from '@academic/modules/teacher-picket-schedules/repository';
import { NotFoundError } from '@app/index.js';
import type { CreateTeacherPicketScheduleDto, UpdateTeacherPicketScheduleDto } from '@academic/modules/teacher-picket-schedules/domain';

import { prisma } from '@academic/database/index.js';

export class TeacherPicketScheduleService {
  constructor(private repository: TeacherPicketScheduleRepository) {}

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
    if (!item) throw new NotFoundError('Teacher picket schedule tidak ditemukan');
    return item;
  }

  async create(data: CreateTeacherPicketScheduleDto) {
    // Check if teacher already has ANY schedule (one teacher = one day per week)
    const existingAnyDay = await prisma.teacherPicketSchedule.findFirst({
      where: {
        teacherId: data.teacherId,
        deletedAt: null,
      },
    });

    if (existingAnyDay) {
      if (existingAnyDay.day === data.day) {
        // Same day → reactivate if soft-deleted, or just return existing
        return this.repository.update(existingAnyDay.id, {
          status: data.status || 'Aktif',
          deletedAt: null,
        } as any);
      }
      throw new Error(`Guru sudah memiliki jadwal piket di hari ${existingAnyDay.day}`);
    }

    return this.repository.create(data as any);
  }

  async update(id: string, data: UpdateTeacherPicketScheduleDto) {
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

  async createBulk(items: CreateTeacherPicketScheduleDto[]) {
    if (!items || items.length === 0) return { created: 0 };

    let count = 0;
    for (const item of items) {
      await this.create(item);
      count++;
    }
    return { created: count };
  }
}

export const teacherPicketSchedulesService = new TeacherPicketScheduleService(teacherPicketScheduleRepository);
