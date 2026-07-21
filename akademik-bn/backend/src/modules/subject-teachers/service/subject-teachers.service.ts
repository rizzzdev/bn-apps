import { SubjectTeacherRepository, subjectTeacherRepository } from '@/modules/subject-teachers/repository';
import { NotFoundError } from '@/errors';
import type { CreateSubjectTeacherDto, UpdateSubjectTeacherDto } from '@/modules/subject-teachers/domain';

import { prisma } from '@/database';

export class SubjectTeacherService {
  constructor(private repository: SubjectTeacherRepository) {}

  async getAll(page: number, limit: number, subjectId?: string, status?: string) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findAll(skip, limit, subjectId, status),
      this.repository.count(subjectId, status),
    ]);
    return { data, total };
  }

  async getById(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Subject teacher tidak ditemukan');
    return item;
  }

  async create(data: CreateSubjectTeacherDto) {
    const existing = await prisma.subjectTeacher.findFirst({
      where: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
      },
    });

    if (existing) {
      return this.repository.update(existing.id, {
        status: (data.status as any) || 'Aktif',
        deletedAt: null,
      } as any);
    }

    return this.repository.create(data as any);
  }

  async update(id: string, data: UpdateSubjectTeacherDto) {
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

export const subjectTeachersService = new SubjectTeacherService(subjectTeacherRepository);
