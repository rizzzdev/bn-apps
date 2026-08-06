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
	ShadowClass,
	ClassStudent,
	CreateClassStudentRequest,
	UpdateClassStudentRequest,
	PromoteHoldRequest,
	TransferRequest,
	BulkStudentActionRequest
} from '$lib/types';

export const classApi = {
	list: (page = 1, limit = 10) => getList<ShadowClass>('/academic/shadow-classes', { page, limit }),
	getById: (id: string) => getById<ShadowClass>('/academic/shadow-classes', id),

	classStudents: {
		list: (page = 1, limit = 10) =>
			getList<ClassStudent>('/academic/class-students', { page, limit }),
		getById: (id: string) => getById<ClassStudent>('/academic/class-students', id),
		create: (data: CreateClassStudentRequest) =>
			createItem<CreateClassStudentRequest, ClassStudent>('/academic/class-students', data),
		update: (id: string, data: UpdateClassStudentRequest) =>
			updateItem<UpdateClassStudentRequest, ClassStudent>('/academic/class-students', id, data),
		delete: (id: string) => deleteItem('/academic/class-students', id),
		bulkCreate: (data: CreateClassStudentRequest[]) =>
			bulkCreate<CreateClassStudentRequest>('/academic/class-students', data),
		bulkDelete: (ids: string[]) => bulkDelete('/academic/class-students', ids),
		bulkStatus: (ids: string[], status: string) =>
			bulkUpdateStatus('/academic/class-students', ids, status),
		promote: (data: PromoteHoldRequest) => bulkAction('/academic/class-students', 'promote', data),
		hold: (data: PromoteHoldRequest) => bulkAction('/academic/class-students', 'hold', data),
		transfer: (data: TransferRequest) => bulkAction('/academic/class-students', 'transfer', data),
		graduate: (data: BulkStudentActionRequest) =>
			bulkAction('/academic/class-students', 'graduate', data)
	}
};
