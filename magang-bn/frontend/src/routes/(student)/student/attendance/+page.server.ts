import type { PageServerLoad } from './$types';
import { fetchApi } from '$lib/utils/server-api';
import { getWIBDate } from '$lib/utils/helpers';
import type { InternshipPlacement, Attendance } from '$lib/types';

export const load: PageServerLoad = async ({ parent, fetch, cookies }) => {
	const { profileData } = await parent();
	const studentId = profileData?.studentId;

	let placements: InternshipPlacement[] = [];
	let todayAttendances: Attendance[] = [];

	if (studentId) {
		const [placementResult, attendanceResult] = await Promise.all([
			fetchApi<InternshipPlacement[]>(
				`/api/v1/internship-placements`,
				{ fetch, cookies },
				{ params: { studentId, limit: 100 } }
			),
			fetchApi<Attendance[]>(
				`/api/v1/attendances`,
				{ fetch, cookies },
				{ params: { studentId, limit: 100 } }
			),
		]);

		if (placementResult.data) {
			placements = placementResult.data;
		}

		if (attendanceResult.data) {
			const wibDateStr = getWIBDate();
			todayAttendances = attendanceResult.data.filter((att) =>
				att.date.startsWith(wibDateStr)
			);
		}
	}

	return {
		placements,
		todayAttendances
	};
};
