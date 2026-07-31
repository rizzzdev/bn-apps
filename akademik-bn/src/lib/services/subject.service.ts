import { getList, getById } from './base';
import type { ShadowSubject } from '$lib/types';

export const subjectApi = {
	list: (page = 1, limit = 10) => getList<ShadowSubject>('/academic/shadow-subjects', { page, limit }),
	getById: (id: string) => getById<ShadowSubject>('/academic/shadow-subjects', id)
};
