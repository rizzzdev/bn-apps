import { prisma } from '#academic/database/index.js';
import { scheduleEventRepository } from '#academic/modules/schedule-events/repository';
import type { ScheduleEventRepository } from '#academic/modules/schedule-events/repository/schedule-events.repository';
import { NotFoundError, ValidationError } from '#app';
import type { CreateScheduleEventDto, UpdateScheduleEventDto } from '#academic/modules/schedule-events/domain';

export class ScheduleEventService {
  constructor(private repository: ScheduleEventRepository) {}

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
    if (!item) throw new NotFoundError('Event jadwal tidak ditemukan');
    return item;
  }

  async create(data: CreateScheduleEventDto) {
    await this.#validateEvent(data.day, data.startHourId, data.durationHours ?? 1, data.name);
    return this.repository.create(data as any);
  }

  async update(id: string, data: UpdateScheduleEventDto) {
    const current = await this.getById(id);
    const finalDay = data.day || current.day;
    const finalStartHourId = data.startHourId || current.startHourId;
    const finalDuration = data.durationHours ?? current.durationHours;
    const finalName = data.name || current.name;
    await this.#validateEvent(finalDay, finalStartHourId, finalDuration, finalName, id);
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

  /** Daftar lessonHourId yang diduduki event (berurutan dari jam mulai). */
  async getEventHourIds(startHourId: string, durationHours: number): Promise<string[]> {
    const startHour = await prisma.lessonHour.findFirst({
      where: { id: startHourId, deletedAt: null },
    });
    if (!startHour) throw new NotFoundError('Jam pelajaran tidak ditemukan');

    const hours = await prisma.lessonHour.findMany({
      where: {
        deletedAt: null,
        order: { gte: startHour.order, lt: startHour.order + durationHours },
      },
      orderBy: { order: 'asc' },
    });

    if (hours.length < durationHours) {
      throw new ValidationError(
        `Durasi event ${durationHours} jam melebihi jam pelajaran yang tersedia (mulai dari ${startHour.name}).`,
      );
    }

    return hours.map((h) => h.id);
  }

  /** Validasi bentrok: sesama event & dengan jadwal pelajaran existing (event berlaku semua kelas). */
  async #validateEvent(
    day: string,
    startHourId: string,
    durationHours: number,
    name: string,
    excludeId?: string,
  ) {
    const hourIds = await this.getEventHourIds(startHourId, durationHours);

    // 1) Bentrok sesama event
    const eventFilter: any = { day, deletedAt: null };
    if (excludeId) eventFilter.id = { not: excludeId };
    const existingEvents = await prisma.scheduleEvent.findMany({
      where: eventFilter,
      select: { id: true, name: true, startHourId: true, durationHours: true },
    });

    for (const ev of existingEvents) {
      const evHourIds = await this.getEventHourIds(ev.startHourId, ev.durationHours);
      const evSet = new Set(evHourIds);
      if (hourIds.some((id) => evSet.has(id))) {
        throw new ValidationError(
          `Event \"${name}\" bentrok dengan event \"${ev.name}\" pada hari ${day}.`,
        );
      }
    }

    // 2) Bentrok dengan jadwal pelajaran (event berlaku untuk semua kelas)
    const conflicts = await prisma.lessonSchedule.findMany({
      where: { day, deletedAt: null, lessonHourId: { in: hourIds } },
      select: { id: true },
    });
    if (conflicts.length > 0) {
      throw new ValidationError(
        `Tidak dapat menambahkan event \"${name}\" pada hari ${day}: slot jam tersebut sudah terisi jadwal pelajaran.`,
      );
    }
  }
}

export const scheduleEventsService = new ScheduleEventService(scheduleEventRepository);
