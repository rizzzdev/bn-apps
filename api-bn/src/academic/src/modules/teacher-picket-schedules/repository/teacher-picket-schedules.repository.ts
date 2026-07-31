import { prisma } from '@academic/database/index.js';
import type { TeacherPicketScheduleType } from '@academic/modules/teacher-picket-schedules/domain';

export class TeacherPicketScheduleRepository {
  async findAll(skip: number, take: number) {
    return prisma.teacherPicketSchedule.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count() {
    return prisma.teacherPicketSchedule.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.teacherPicketSchedule.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async create(data: Omit<TeacherPicketScheduleType, 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    return prisma.teacherPicketSchedule.create({ data: data as any });
  }

  async update(id: string, data: Partial<TeacherPicketScheduleType>) {
    return prisma.teacherPicketSchedule.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.teacherPicketSchedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(ids: string[]) {
    return prisma.teacherPicketSchedule.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatusMany(ids: string[], status: string) {
    return prisma.teacherPicketSchedule.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { status: status as any },
    });
  }

  async createMany(data: any[]) {
    return prisma.teacherPicketSchedule.createMany({ data, skipDuplicates: true });
  }
}

export const teacherPicketScheduleRepository = new TeacherPicketScheduleRepository();
