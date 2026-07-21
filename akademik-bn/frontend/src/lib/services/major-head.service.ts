import {
	getList,
	getById,
	createItem,
	updateItem,
	deleteItem,
	bulkDelete,
	bulkUpdateStatus
} from './base';
import type { MajorHead, CreateMajorHeadRequest, UpdateMajorHeadRequest } from '$lib/types';

export const majorHeadApi = {
	list: (page = 1, limit = 10) => getList<MajorHead>('/major-heads', { page, limit }),
	listByMajor: (majorId: string, academicYearId?: string) =>
		getList<MajorHead>('/major-heads', {
			majorId,
			...(academicYearId ? { academicYearId } : {}),
			limit: 100
		}),
	getById: (id: string) => getById<MajorHead>('/major-heads', id),
	create: (data: CreateMajorHeadRequest) =>
		createItem<CreateMajorHeadRequest, MajorHead>('/major-heads', data),
	update: (id: string, data: UpdateMajorHeadRequest) =>
		updateItem<UpdateMajorHeadRequest, MajorHead>('/major-heads', id, data),
	delete: (id: string) => deleteItem('/major-heads', id),
	bulkDelete: (ids: string[]) => bulkDelete('/major-heads', ids),
	bulkStatus: (ids: string[], status: string) => bulkUpdateStatus('/major-heads', ids, status),
	assignHead: (data: { majorId: string; teacherId: string; academicYearId?: string }) =>
		createItem<{ majorId: string; teacherId: string; academicYearId?: string }, MajorHead>(
			'/major-heads/assign',
			data
		)
};
