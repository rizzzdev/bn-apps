import type { PageServerLoad } from './$types';
import { fetchApi } from '$lib/utils/server-api';
import type { Attendance } from '$lib/types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	let attendances: Attendance[] = [];

	const result = await fetchApi<Attendance[]>(
		`/api/v1/attendances`,
		{ fetch, cookies },
		{ params: { limit: 1000 } }
	);
	if (result.data) {
		attendances = result.data;
	}

	return {
		attendances
	};
};
