import {
	getList,
	getById,
	createItem,
	updateItem,
	deleteItem,
	bulkDelete,
	bulkUpdateStatus
} from './base';
import type { LessonHour, CreateLessonHourRequest, UpdateLessonHourRequest } from '$lib/types';

export const lessonHourApi = {
	list: (page = 1, limit = 20) => getList<LessonHour>('/academic/lesson-hours', { page, limit }),
	getById: (id: string) => getById<LessonHour>('/academic/lesson-hours', id),
	create: (data: CreateLessonHourRequest) =>
		createItem<CreateLessonHourRequest, LessonHour>('/academic/lesson-hours', data),
	update: (id: string, data: UpdateLessonHourRequest) =>
		updateItem<UpdateLessonHourRequest, LessonHour>('/academic/lesson-hours', id, data),
	delete: (id: string) => deleteItem('/academic/lesson-hours', id),
	bulkDelete: (ids: string[]) => bulkDelete('/academic/lesson-hours', ids),
	bulkStatus: (ids: string[], status: string) =>
		bulkUpdateStatus('/academic/lesson-hours', ids, status)
};
