import { getList, getById, createItem, updateItem, deleteItem, bulkDelete, bulkUpdateStatus, bulkAction } from './base';
import type {
  LessonSchedule,
  CreateLessonScheduleRequest,
  UpdateLessonScheduleRequest
} from '$lib/types';

export const lessonScheduleApi = {
  list: (page = 1, limit = 50, params?: { day?: string; classId?: string; teacherId?: string }) =>
    getList<LessonSchedule>('/lesson-schedules', { page, limit, ...params }),
  getById: (id: string) => getById<LessonSchedule>('/lesson-schedules', id),
  create: (data: CreateLessonScheduleRequest) =>
    createItem<CreateLessonScheduleRequest, LessonSchedule>('/lesson-schedules', data),
  update: (id: string, data: UpdateLessonScheduleRequest) =>
    updateItem<UpdateLessonScheduleRequest, LessonSchedule>('/lesson-schedules', id, data),
  delete: (id: string) => deleteItem('/lesson-schedules', id),
  bulkCreate: (items: CreateLessonScheduleRequest[]) =>
    bulkAction('/lesson-schedules', 'bulk', { data: items }),
  bulkDelete: (ids: string[]) => bulkDelete('/lesson-schedules', ids),
  bulkStatus: (ids: string[], status: string) =>
    bulkUpdateStatus('/lesson-schedules', ids, status)
};
