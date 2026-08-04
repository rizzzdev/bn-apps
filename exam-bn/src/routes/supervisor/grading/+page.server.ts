import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';

export const actions: Actions = {
	grade: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();

		const examRoomId = data.get('examRoomId') as string;
		const targetUserId = data.get('userId') as string;
		const mcWeight = parseFloat((data.get('mcWeight') as string) ?? '1');
		const essayWeight = parseFloat((data.get('essayWeight') as string) ?? '0');
		const questionIds = data.getAll('questionId') as string[];
		const pointsArr = data.getAll('points') as string[];

		if (Math.abs(mcWeight + essayWeight - 1) > 0.001) {
			return { action: 'grade', error: 'Bobot MC + Bobot Esai harus sama dengan 100%.' };
		}

		try {
			for (let i = 0; i < questionIds.length; i++) {
				await serverApi.post(token, '/exam/essay-grades', {
					examRoomId,
					userId: targetUserId,
					questionId: questionIds[i],
					points: parseInt(pointsArr[i] ?? '0', 10)
				});
			}

			const result = await serverApi.post<{ score: number }>(
				token,
				`/exam/exam-rooms/${examRoomId}/grade/${targetUserId}`,
				{ mcWeight, essayWeight }
			);

			return {
				action: 'grade',
				success: true,
				message: `Nilai ${result.score} berhasil disimpan.`,
				userId: targetUserId,
				score: result.score
			};
		} catch (e: unknown) {
			return { action: 'grade', error: (e as Error).message };
		}
	}
};
