import { prisma } from '#academic/database/index.js';

export class ScheduleEventRepository {
  async findAll(skip: number, take: number) {
    return prisma.scheduleEvent.findMany({
      where: { deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { startHour: true },
    });
  }

  async count() {
    return prisma.scheduleEvent.count({ where: { deletedAt: null } });
  }

  async findById(id: string) {
    return prisma.scheduleEvent.findFirst({
      where: { id, deletedAt: null },
      include: { startHour: true },
    });
  }

  async create(data: {
    name: string;
    day: string;
    startHourId: string;
    durationHours: number;
    notes?: string | null;
  }) {
    return prisma.scheduleEvent.create({
      data,
      include: { startHour: true },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      day?: string;
      startHourId?: string;
      durationHours?: number;
      notes?: string | null;
    },
  ) {
    return prisma.scheduleEvent.update({
      where: { id },
      data,
      include: { startHour: true },
    });
  }

  async softDelete(id: string) {
    return prisma.scheduleEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(ids: string[]) {
    return prisma.scheduleEvent.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}

export const scheduleEventRepository = new ScheduleEventRepository();
