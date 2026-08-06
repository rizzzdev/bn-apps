import {
	getList,
	getById,
	createItem,
	updateItem,
	deleteItem,
	bulkDelete,
	bulkUpdateStatus,
	bulkUpdateTargetHours
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
		getList<ShadowTeacher>('/academic/shadow-teachers', { page, limit, ...extra }),
	getById: (id: string) => getById<ShadowTeacher>('/academic/shadow-teachers', id),

	homeroom: {
		list: (page = 1, limit = 10) =>
			getList<HomeroomTeacher>('/academic/homeroom-teachers', { page, limit }),
		listByClass: (classId: string) =>
			getList<HomeroomTeacher>('/academic/homeroom-teachers', { classId, limit: 100 }),
		getById: (id: string) => getById<HomeroomTeacher>('/academic/homeroom-teachers', id),
		create: (data: CreateHomeroomTeacherRequest) =>
			createItem<CreateHomeroomTeacherRequest, HomeroomTeacher>(
				'/academic/homeroom-teachers',
				data
			),
		update: (id: string, data: UpdateHomeroomTeacherRequest) =>
			updateItem<UpdateHomeroomTeacherRequest, HomeroomTeacher>(
				'/academic/homeroom-teachers',
				id,
				data
			),
		delete: (id: string) => deleteItem('/academic/homeroom-teachers', id),
		bulkDelete: (ids: string[]) => bulkDelete('/academic/homeroom-teachers', ids),
		bulkStatus: (ids: string[], status: string) =>
			bulkUpdateStatus('/academic/homeroom-teachers', ids, status)
	},

	subjectTeachers: {
		list: (page = 1, limit = 10) =>
			getList<SubjectTeacher>('/academic/subject-teachers', { page, limit }),
		listBySubject: (subjectId: string) =>
			getList<SubjectTeacher>('/academic/subject-teachers', { subjectId, limit: 100 }),
		getById: (id: string) => getById<SubjectTeacher>('/academic/subject-teachers', id),
		create: (data: CreateSubjectTeacherRequest) =>
			createItem<CreateSubjectTeacherRequest, SubjectTeacher>('/academic/subject-teachers', data),
		update: (id: string, data: UpdateSubjectTeacherRequest) =>
			updateItem<UpdateSubjectTeacherRequest, SubjectTeacher>(
				'/academic/subject-teachers',
				id,
				data
			),
		delete: (id: string) => deleteItem('/academic/subject-teachers', id),
		bulkDelete: (ids: string[]) => bulkDelete('/academic/subject-teachers', ids),
		bulkStatus: (ids: string[], status: string) =>
			bulkUpdateStatus('/academic/subject-teachers', ids, status),
		bulkTargetHours: (ids: string[], targetHours: number) =>
			bulkUpdateTargetHours('/academic/subject-teachers', ids, targetHours)
	}
};
