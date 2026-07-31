import {
	getList,
	getById,
	createItem,
	updateItem,
	deleteItem,
	bulkCreate,
	bulkDelete,
	bulkUpdateStatus
} from './base';
import type {
	TeacherPicketSchedule,
	CreateTeacherPicketScheduleRequest,
	UpdateTeacherPicketScheduleRequest
} from '$lib/types';

export const scheduleApi = {
	list: (page = 1, limit = 10) =>
		getList<TeacherPicketSchedule>('/academic/teacher-picket-schedules', { page, limit }),
	getById: (id: string) => getById<TeacherPicketSchedule>('/academic/teacher-picket-schedules', id),
	create: (data: CreateTeacherPicketScheduleRequest) =>
		createItem<CreateTeacherPicketScheduleRequest, TeacherPicketSchedule>(
			'/academic/teacher-picket-schedules',
			data
		),
	update: (id: string, data: UpdateTeacherPicketScheduleRequest) =>
		updateItem<UpdateTeacherPicketScheduleRequest, TeacherPicketSchedule>(
			'/academic/teacher-picket-schedules',
			id,
			data
		),
	delete: (id: string) => deleteItem('/academic/teacher-picket-schedules', id),
	bulkCreate: (data: CreateTeacherPicketScheduleRequest[]) =>
		bulkCreate<CreateTeacherPicketScheduleRequest>('/academic/teacher-picket-schedules', data),
	bulkDelete: (ids: string[]) => bulkDelete('/academic/teacher-picket-schedules', ids),
	bulkStatus: (ids: string[], status: string) =>
		bulkUpdateStatus('/academic/teacher-picket-schedules', ids, status)
};
