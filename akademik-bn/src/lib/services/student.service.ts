import { getList, getById } from './base';
import type { ShadowStudent } from '$lib/types';

export const studentApi = {
	list: (page = 1, limit = 10, extra?: Record<string, string>) =>
		getList<ShadowStudent>('/academic/shadow-students', { page, limit, ...extra }),
	getById: (id: string) => getById<ShadowStudent>('/academic/shadow-students', id)
};
