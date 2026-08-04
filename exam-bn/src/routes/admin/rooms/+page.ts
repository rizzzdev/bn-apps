import type { PageLoad } from './$types';
import { api } from '$lib/api';
import type { Room } from '$lib/types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { token } = await parent();
	const rooms = await api.safeGet<Room[]>(fetch, '/rooms', [], { limit: 1000 });
	return { rooms };
};
