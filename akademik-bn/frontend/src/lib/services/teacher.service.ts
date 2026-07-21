import {
	getList,
	getById,
	createItem,
	updateItem,
	deleteItem,
	bulkDelete,
	bulkUpdateStatus
} from './base';
import type {
	ShadowTeacher,
	HomeroomTeacher,
	SubjectTeacher,
	CreateHomeroomTeacherRequest,
	UpdateHomeroomTeacherRequest,
	CreateSubjectTeacherRequest,
	UpdateSubjectTeacherRequest
} from '$lib/types';

export const teacherApi = {
	list: (page = 1, limit = 10, extra?: Record<string, string>) =>
		getList<ShadowTeacher>('/shadow-teachers', { page, limit, ...extra }),
	getById: (id: string) => getById<ShadowTeacher>('/shadow-teachers', id),

	homeroom: {
		list: (page = 1, limit = 10) => getList<HomeroomTeacher>('/homeroom-teachers', { page, limit }),
		listByClass: (classId: string) =>
			getList<HomeroomTeacher>('/homeroom-teachers', { classId, limit: 100 }),
		getById: (id: string) => getById<HomeroomTeacher>('/homeroom-teachers', id),
		create: (data: CreateHomeroomTeacherRequest) =>
			createItem<CreateHomeroomTeacherRequest, HomeroomTeacher>('/homeroom-teachers', data),
		update: (id: string, data: UpdateHomeroomTeacherRequest) =>
			updateItem<UpdateHomeroomTeacherRequest, HomeroomTeacher>('/homeroom-teachers', id, data),
		delete: (id: string) => deleteItem('/homeroom-teachers', id),
		bulkDelete: (ids: string[]) => bulkDelete('/homeroom-teachers', ids),
		bulkStatus: (ids: string[], status: string) =>
			bulkUpdateStatus('/homeroom-teachers', ids, status)
	},

	subjectTeachers: {
		list: (page = 1, limit = 10) => getList<SubjectTeacher>('/subject-teachers', { page, limit }),
		listBySubject: (subjectId: string) =>
			getList<SubjectTeacher>('/subject-teachers', { subjectId, limit: 100 }),
		getById: (id: string) => getById<SubjectTeacher>('/subject-teachers', id),
		create: (data: CreateSubjectTeacherRequest) =>
			createItem<CreateSubjectTeacherRequest, SubjectTeacher>('/subject-teachers', data),
		update: (id: string, data: UpdateSubjectTeacherRequest) =>
			updateItem<UpdateSubjectTeacherRequest, SubjectTeacher>('/subject-teachers', id, data),
		delete: (id: string) => deleteItem('/subject-teachers', id),
		bulkDelete: (ids: string[]) => bulkDelete('/subject-teachers', ids),
		bulkStatus: (ids: string[], status: string) =>
			bulkUpdateStatus('/subject-teachers', ids, status)
	}
};
