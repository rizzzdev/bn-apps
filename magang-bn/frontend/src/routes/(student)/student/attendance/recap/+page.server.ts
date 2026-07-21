import type { PageServerLoad } from './$types';
import { fetchApi } from '$lib/utils/server-api';
import type { Attendance } from '$lib/types';

export const load: PageServerLoad = async ({ cookies, parent, fetch }) => {
	const parentData = await parent();
	const { profileData } = parentData;

	let attendances: Attendance[] = [];

	if (profileData?.studentId) {
		const result = await fetchApi<Attendance[]>(
			`/api/v1/attendances`,
			{ fetch, cookies },
			{ params: { studentId: profileData.studentId, limit: 500 } }
		);
		if (result.data) {
			attendances = result.data;
		}
	}

	return {
		attendances
	};
};
