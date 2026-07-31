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
	list: (page = 1, limit = 10) => getList<MajorHead>('/academic/major-heads', { page, limit }),
	listByMajor: (majorId: string, academicYearId?: string) =>
		getList<MajorHead>('/academic/major-heads', {
			majorId,
			...(academicYearId ? { academicYearId } : {}),
			limit: 100
		}),
	getById: (id: string) => getById<MajorHead>('/academic/major-heads', id),
	create: (data: CreateMajorHeadRequest) =>
		createItem<CreateMajorHeadRequest, MajorHead>('/academic/major-heads', data),
	update: (id: string, data: UpdateMajorHeadRequest) =>
		updateItem<UpdateMajorHeadRequest, MajorHead>('/academic/major-heads', id, data),
	delete: (id: string) => deleteItem('/academic/major-heads', id),
	bulkDelete: (ids: string[]) => bulkDelete('/academic/major-heads', ids),
	bulkStatus: (ids: string[], status: string) => bulkUpdateStatus('/academic/major-heads', ids, status),
	assignHead: (data: { majorId: string; teacherId: string; academicYearId?: string }) =>
		createItem<{ majorId: string; teacherId: string; academicYearId?: string }, MajorHead>(
			'/academic/major-heads/assign',
			data
		)
};
