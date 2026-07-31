import { getList, getById } from './base';
import type { ShadowAcademicYear } from '$lib/types';

export const academicYearApi = {
	list: (page = 1, limit = 10) =>
		getList<ShadowAcademicYear>('/academic/shadow-academic-years', { page, limit }),
	getById: (id: string) => getById<ShadowAcademicYear>('/academic/shadow-academic-years', id)
};
