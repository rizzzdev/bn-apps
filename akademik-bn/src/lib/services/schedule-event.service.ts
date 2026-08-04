import { getList, getById, createItem, updateItem, deleteItem, bulkDelete } from './base';
import type {
	ScheduleEvent,
	CreateScheduleEventRequest,
	UpdateScheduleEventRequest
} from '$lib/types';

export const scheduleEventApi = {
	list: (page = 1, limit = 100) =>
		getList<ScheduleEvent>('/academic/schedule-events', { page, limit }),
	getById: (id: string) => getById<ScheduleEvent>('/academic/schedule-events', id),
	create: (data: CreateScheduleEventRequest) =>
		createItem<CreateScheduleEventRequest, ScheduleEvent>('/academic/schedule-events', data),
	update: (id: string, data: UpdateScheduleEventRequest) =>
		updateItem<UpdateScheduleEventRequest, ScheduleEvent>('/academic/schedule-events', id, data),
	delete: (id: string) => deleteItem('/academic/schedule-events', id),
	bulkDelete: (ids: string[]) => bulkDelete('/academic/schedule-events', ids)
};
