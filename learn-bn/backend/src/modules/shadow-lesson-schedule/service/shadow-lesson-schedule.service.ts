import { LessonScheduleRepository, lessonScheduleRepository } from '../repository';
import { NotFoundError } from '@/errors';
import type { WebhookLessonScheduleDto } from '../domain/schemas';

export class LessonScheduleService {
  constructor(private repository: LessonScheduleRepository) {}

  async getAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.repository.findAll(skip, limit);
    return { data, total: data.length };
  }

  async getById(id: string) {
    const data = await this.repository.findById(id);
    if (!data) throw new NotFoundError('Data tidak ditemukan');
    return data;
  }

  async upsertFromWebhook(items: WebhookLessonScheduleDto[]) {
    let count = 0;
    for (const item of items) {
      const { id, lessonHour, teachers, classes, ...rest } = item;

      // Upsert lesson hour first
      const lessonHourPayload: any = { ...lessonHour };
      if (lessonHourPayload.createdAt) lessonHourPayload.createdAt = new Date(lessonHourPayload.createdAt);
      if (lessonHourPayload.updatedAt) lessonHourPayload.updatedAt = new Date(lessonHourPayload.updatedAt);
      if (lessonHourPayload.deletedAt) lessonHourPayload.deletedAt = new Date(lessonHourPayload.deletedAt);
      lessonHourPayload.lastSyncAt = new Date();
      delete lessonHourPayload.lastSyncAt; // no lastSyncAt on lessonHour in payload
      await this.repository.upsertLessonHour(lessonHour.id, lessonHourPayload);

      // Upsert lesson schedule
      const payload: any = { ...rest };
      delete payload.subject;

      if (payload.createdAt) payload.createdAt = new Date(payload.createdAt);
      if (payload.updatedAt) payload.updatedAt = new Date(payload.updatedAt);
      if (payload.deletedAt) payload.deletedAt = new Date(payload.deletedAt);
      payload.lastSyncAt = new Date();

      await this.repository.upsert(id, payload);

      // Replace teachers
      await this.repository.deleteTeachersBySchedule(id);
      for (const t of teachers) {
        const tp: any = {
          id: t.id,
          lessonScheduleId: id,
          teacherId: t.teacherId,
        };
        if (t.createdAt) tp.createdAt = new Date(t.createdAt);
        if (t.deletedAt) tp.deletedAt = t.deletedAt ? new Date(t.deletedAt) : null;
        await this.repository.createTeacher(tp);
      }

      // Replace classes
      await this.repository.deleteClassesBySchedule(id);
      for (const c of classes) {
        const cp: any = {
          id: c.id,
          lessonScheduleId: id,
          classId: c.classId,
        };
        if (c.createdAt) cp.createdAt = new Date(c.createdAt);
        if (c.deletedAt) cp.deletedAt = c.deletedAt ? new Date(c.deletedAt) : null;
        await this.repository.createClass(cp);
      }

      count++;
    }
    return { upserted: count };
  }
}

export const lessonScheduleService = new LessonScheduleService(lessonScheduleRepository);
