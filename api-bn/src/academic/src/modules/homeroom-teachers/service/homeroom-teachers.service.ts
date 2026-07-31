import { HomeroomTeacherRepository, homeroomTeacherRepository } from '@academic/modules/homeroom-teachers/repository';
import { NotFoundError } from '@app/index.js';
import { prisma } from '@academic/database/index.js';
import type { CreateHomeroomTeacherDto, UpdateHomeroomTeacherDto } from '@academic/modules/homeroom-teachers/domain';

export class HomeroomTeacherService {
  constructor(private repository: HomeroomTeacherRepository) {}

  async getAll(page: number, limit: number, classId?: string, status?: string) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, limit, classId, status),
      this.repository.count(classId, status),
    ]);
    return { data, total };
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Homeroom teacher tidak ditemukan');
    return item;
  }

  async create(data: CreateHomeroomTeacherDto) {
    const currentActive = await prisma.homeroomTeacher.findFirst({
      where: {
        classId: data.classId,
        academicYearId: data.academicYearId,
        status: 'Aktif',
        deletedAt: null,
      },
    });

    if (currentActive) {
      if (currentActive.teacherId === data.teacherId) {
        return currentActive;
      }

      await prisma.homeroomTeacher.update({
        where: { id: currentActive.id },
        data: { status: 'TidakAktif' },
      });
    }

    return this.repository.create(data as any);
  }

  async update(id: string, data: UpdateHomeroomTeacherDto) {
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

export const homeroomTeachersService = new HomeroomTeacherService(homeroomTeacherRepository);
