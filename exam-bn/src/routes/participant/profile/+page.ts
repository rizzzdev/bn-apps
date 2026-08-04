import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { User } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token, user } = await parent();
	const userId = user?.id ?? '';
	const profileUser = await api.safeGet<User>(fetch, `/users/${userId}`, null as unknown as User);
	return { profileUser };
};
