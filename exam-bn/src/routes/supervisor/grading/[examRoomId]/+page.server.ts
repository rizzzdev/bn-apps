import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';

export const actions: Actions = {
	grade: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();

		const examRoomId = data.get('examRoomId') as string;
		const userId = data.get('userId') as string;
		const mcWeight = parseFloat((data.get('mcWeight') as string) || '1');
		const essayWeight = parseFloat((data.get('essayWeight') as string) || '0');

		const questionIds = data.getAll('questionId') as string[];
		const pointsArr = data.getAll('points') as string[];

		if (!examRoomId || !userId) {
			return fail(400, { error: 'Invalid payload.' });
		}

		try {
			await Promise.all(
				questionIds.map((qId, idx) => {
					const pts = parseInt(pointsArr[idx] || '0', 10);
					return serverApi.post(token, '/essay-grades', {
						examRoomId,
						userId,
						questionId: qId,
						points: pts
					});
				})
			);

			const res = (await serverApi.post(token, `/exam-rooms/${examRoomId}/grade/${userId}`, {
				mcWeight,
				essayWeight
			})) as any;

			return { success: true, message: 'Nilai berhasil disimpan.', score: res.score };
		} catch (e: unknown) {
			return fail(400, { error: (e as Error).message });
		}
	}
};
