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
	list: (page = 1, limit = 10) => getList<ShadowClass>('/shadow-classes', { page, limit }),
	getById: (id: string) => getById<ShadowClass>('/shadow-classes', id),

	classStudents: {
		list: (page = 1, limit = 10) => getList<ClassStudent>('/class-students', { page, limit }),
		getById: (id: string) => getById<ClassStudent>('/class-students', id),
		create: (data: CreateClassStudentRequest) =>
			createItem<CreateClassStudentRequest, ClassStudent>('/class-students', data),
		update: (id: string, data: UpdateClassStudentRequest) =>
			updateItem<UpdateClassStudentRequest, ClassStudent>('/class-students', id, data),
		delete: (id: string) => deleteItem('/class-students', id),
		bulkCreate: (data: CreateClassStudentRequest[]) =>
			bulkCreate<CreateClassStudentRequest>('/class-students', data),
		bulkDelete: (ids: string[]) => bulkDelete('/class-students', ids),
		bulkStatus: (ids: string[], status: string) => bulkUpdateStatus('/class-students', ids, status),
		promote: (data: PromoteHoldRequest) => bulkAction('/class-students', 'promote', data),
		hold: (data: PromoteHoldRequest) => bulkAction('/class-students', 'hold', data),
		transfer: (data: TransferRequest) => bulkAction('/class-students', 'transfer', data),
		graduate: (data: BulkStudentActionRequest) => bulkAction('/class-students', 'graduate', data)
	}
};
