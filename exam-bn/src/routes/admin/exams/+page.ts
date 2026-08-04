import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { Exam, User } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token } = await parent();
	const exams = await api.safeGet<Exam[]>(fetch, '/exam/exams', [], { limit: 100 });
	const users = await api.safeGet<User[]>(fetch, '/exam/users', [], {
		role: 'teacher',
		limit: 100
	});
	return { exams, supervisors: users };
};
