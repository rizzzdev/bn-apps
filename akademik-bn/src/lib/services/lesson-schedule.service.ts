import {
	getList,
	getById,
	createItem,
	updateItem,
	deleteItem,
	bulkDelete,
	bulkUpdateStatus,
	bulkAction
} from './base';
import type {
	LessonSchedule,
	CreateLessonScheduleRequest,
	UpdateLessonScheduleRequest
} from '$lib/types';

export const lessonScheduleApi = {
	list: (page = 1, limit = 50, params?: { day?: string; classId?: string; teacherId?: string }) =>
		getList<LessonSchedule>('/academic/lesson-schedules', { page, limit, ...params }),
	getById: (id: string) => getById<LessonSchedule>('/academic/lesson-schedules', id),
	create: (data: CreateLessonScheduleRequest) =>
		createItem<CreateLessonScheduleRequest, LessonSchedule>('/academic/lesson-schedules', data),
	update: (id: string, data: UpdateLessonScheduleRequest) =>
		updateItem<UpdateLessonScheduleRequest, LessonSchedule>('/academic/lesson-schedules', id, data),
	delete: (id: string) => deleteItem('/academic/lesson-schedules', id),
	bulkCreate: (items: CreateLessonScheduleRequest[]) =>
		bulkAction('/academic/lesson-schedules', 'batch', { data: items }),
	bulkDelete: (ids: string[]) => bulkDelete('/academic/lesson-schedules', ids),
	bulkStatus: (ids: string[], status: string) =>
		bulkUpdateStatus('/academic/lesson-schedules', ids, status)
};
