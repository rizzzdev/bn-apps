import { prisma } from '@academic/database/index.js';

export class LessonHourRepository {
  async findAll(skip: number, take: number) {
    return prisma.lessonHour.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { order: 'asc' },
    });
  }

  async count() {
    return prisma.lessonHour.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.lessonHour.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: { name: string; startTime: string; endTime: string; order: number }) {
    return prisma.lessonHour.create({ data });
  }

  async update(id: string, data: { name?: string; startTime?: string; endTime?: string; order?: number }) {
    return prisma.lessonHour.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.lessonHour.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(ids: string[]) {
    return prisma.lessonHour.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatusMany(ids: string[], _status: string) {
    return prisma.lessonHour.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: _status === 'Aktif' ? null : new Date() },
    });
  }
}

export const lessonHourRepository = new LessonHourRepository();
