import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { User } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token } = await parent();
	const users = await api.safeGet<User[]>(fetch, '/exam/users', [], { limit: 1000 });
	return { users };
};
