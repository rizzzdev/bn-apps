import {
	getList,
	getById,
	createItem,
	updateItem,
	deleteItem,
	bulkCreate,
	bulkDelete,
	bulkUpdateStatus,
	bulkAction
} from './base';
import type {
	ShadowMajor,
	MajorStudent,
	CreateMajorStudentRequest,
	UpdateMajorStudentRequest,
	BulkStudentActionRequest
} from '$lib/types';

export const majorApi = {
	list: (page = 1, limit = 10) => getList<ShadowMajor>('/academic/shadow-majors', { page, limit }),
	getById: (id: string) => getById<ShadowMajor>('/academic/shadow-majors', id),

	majorStudents: {
		list: (page = 1, limit = 10) =>
			getList<MajorStudent>('/academic/major-students', { page, limit }),
		getById: (id: string) => getById<MajorStudent>('/academic/major-students', id),
		create: (data: CreateMajorStudentRequest) =>
			createItem<CreateMajorStudentRequest, MajorStudent>('/academic/major-students', data),
		update: (id: string, data: UpdateMajorStudentRequest) =>
			updateItem<UpdateMajorStudentRequest, MajorStudent>('/academic/major-students', id, data),
		delete: (id: string) => deleteItem('/academic/major-students', id),
		bulkCreate: (data: CreateMajorStudentRequest[]) =>
			bulkCreate<CreateMajorStudentRequest>('/academic/major-students', data),
		bulkDelete: (ids: string[]) => bulkDelete('/academic/major-students', ids),
		bulkStatus: (ids: string[], status: string) =>
			bulkUpdateStatus('/academic/major-students', ids, status),
		transfer: (data: BulkStudentActionRequest) =>
			bulkAction('/academic/major-students', 'transfer', data),
		graduate: (data: BulkStudentActionRequest) =>
			bulkAction('/academic/major-students', 'graduate', data)
	}
};
