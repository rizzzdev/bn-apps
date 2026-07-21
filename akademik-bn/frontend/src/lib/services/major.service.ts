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
	list: (page = 1, limit = 10) => getList<ShadowMajor>('/shadow-majors', { page, limit }),
	getById: (id: string) => getById<ShadowMajor>('/shadow-majors', id),

	majorStudents: {
		list: (page = 1, limit = 10) => getList<MajorStudent>('/major-students', { page, limit }),
		getById: (id: string) => getById<MajorStudent>('/major-students', id),
		create: (data: CreateMajorStudentRequest) =>
			createItem<CreateMajorStudentRequest, MajorStudent>('/major-students', data),
		update: (id: string, data: UpdateMajorStudentRequest) =>
			updateItem<UpdateMajorStudentRequest, MajorStudent>('/major-students', id, data),
		delete: (id: string) => deleteItem('/major-students', id),
		bulkCreate: (data: CreateMajorStudentRequest[]) =>
			bulkCreate<CreateMajorStudentRequest>('/major-students', data),
		bulkDelete: (ids: string[]) => bulkDelete('/major-students', ids),
		bulkStatus: (ids: string[], status: string) => bulkUpdateStatus('/major-students', ids, status),
		transfer: (data: BulkStudentActionRequest) => bulkAction('/major-students', 'transfer', data),
		graduate: (data: BulkStudentActionRequest) => bulkAction('/major-students', 'graduate', data)
	}
};
