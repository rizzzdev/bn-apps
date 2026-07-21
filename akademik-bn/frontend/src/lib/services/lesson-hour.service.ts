import { getList, getById, createItem, updateItem, deleteItem, bulkDelete, bulkUpdateStatus } from './base';
import type {
  LessonHour,
  CreateLessonHourRequest,
  UpdateLessonHourRequest
} from '$lib/types';

export const lessonHourApi = {
  list: (page = 1, limit = 20) =>
    getList<LessonHour>('/lesson-hours', { page, limit }),
  getById: (id: string) => getById<LessonHour>('/lesson-hours', id),
  create: (data: CreateLessonHourRequest) =>
    createItem<CreateLessonHourRequest, LessonHour>('/lesson-hours', data),
  update: (id: string, data: UpdateLessonHourRequest) =>
    updateItem<UpdateLessonHourRequest, LessonHour>('/lesson-hours', id, data),
  delete: (id: string) => deleteItem('/lesson-hours', id),
  bulkDelete: (ids: string[]) => bulkDelete('/lesson-hours', ids),
  bulkStatus: (ids: string[], status: string) =>
    bulkUpdateStatus('/lesson-hours', ids, status)
};
