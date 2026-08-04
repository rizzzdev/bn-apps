import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi, API_URL } from '$lib/server/api';
import type { Question, Option } from '$lib/types';


export const actions: Actions = {
	addQuestion: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();

		const text = ((data.get('text') as string) ?? '').trim();
		const type = data.get('type') as 'MULTIPLE_CHOICE' | 'ESSAY';
		const questionNumber = Number(data.get('questionNumber'));
		const examRoomIdsRaw = data.getAll('examRoomId') as string[];

		if (!text || !type || !questionNumber)
			return fail(400, {
				action: 'addQuestion',
				error: 'Teks soal, tipe, dan nomor soal wajib diisi.'
			});
		if (examRoomIdsRaw.length === 0)
			return fail(400, { action: 'addQuestion', error: 'Tidak ada ruangan ujian ditemukan.' });

		try {
			const question = await serverApi.post<Question>(token, '/exam/questions', { text, type });

			if (type === 'MULTIPLE_CHOICE') {
				const optionCount = Number(data.get('optionCount') ?? 0);
				const correctIndex = Number(data.get('correct') ?? 0);
				const createdOptions: (Option | null)[] = new Array(optionCount).fill(null);
				for (let i = 0; i < optionCount; i++) {
					const optText = ((data.get(`option_${i}`) as string) ?? '').trim();
					if (optText) {
						const created = await serverApi.post<Option>(token, '/exam/options', {
							questionId: question.id,
							text: optText
						});
						createdOptions[i] = created;
					}
				}
				const nonNull = createdOptions.filter(Boolean);
				if (nonNull.length < 2) {
					await serverApi.delete(token, `/exam/questions/${question.id}`);
					return fail(400, {
						action: 'addQuestion',
						error: 'Minimal 2 pilihan jawaban untuk soal pilihan ganda.'
					});
				}
				const correctOption = createdOptions[correctIndex];
				if (correctOption) {
					await serverApi.post(token, '/exam/question-correct-answers', {
						questionId: question.id,
						optionId: correctOption.id
					});
				}
			}

			for (const examRoomId of examRoomIdsRaw) {
				await serverApi.post(token, '/exam/exam-questions', {
					examRoomId,
					questionId: question.id,
					questionNumber
				});
			}

			return {
				action: 'addQuestion',
				success: true,
				message: 'Soal berhasil ditambahkan ke semua ruangan.'
			};
		} catch (e: unknown) {
			return fail(400, { action: 'addQuestion', error: (e as Error).message });
		}
	},

	editQuestion: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();

		const questionId = data.get('questionId') as string;
		const examQuestionIds = data.getAll('examQuestionId') as string[];
		const text = ((data.get('text') as string) ?? '').trim();
		const type = data.get('type') as 'MULTIPLE_CHOICE' | 'ESSAY';
		const questionNumber = Number(data.get('questionNumber'));
		const existingCorrectAnswerId = data.get('existingCorrectAnswerId') as string | null;

		if (!text || !type)
			return fail(400, { action: 'editQuestion', error: 'Teks soal dan tipe wajib diisi.' });

		try {
			await serverApi.patch(token, `/exam/questions/${questionId}`, { text, type });
			for (const eqId of examQuestionIds) {
				if (questionNumber)
					await serverApi.patch(token, `/exam/exam-questions/${eqId}`, { questionNumber });
			}

			if (type === 'MULTIPLE_CHOICE') {
				const correctIndex = Number(data.get('correct') ?? 0);
				const optionCount = Number(data.get('optionCount') ?? 0);
				const deletedOptionIds = data.getAll('deletedOptionId') as string[];
				for (const optId of deletedOptionIds)
					await serverApi.delete(token, `/exam/options/${optId}`);

				const resultOptionIds: (string | null)[] = new Array(optionCount).fill(null);
				for (let i = 0; i < optionCount; i++) {
					const optText = ((data.get(`option_${i}`) as string) ?? '').trim();
					const existingId = ((data.get(`existingOptionId_${i}`) as string) ?? '').trim() || null;
					if (optText) {
						if (existingId) {
							await serverApi.patch(token, `/exam/options/${existingId}`, { text: optText });
							resultOptionIds[i] = existingId;
						} else {
							const created = await serverApi.post<Option>(token, '/exam/options', {
								questionId,
								text: optText
							});
							resultOptionIds[i] = created.id;
						}
					}
				}
				const nonNull = resultOptionIds.filter(Boolean);
				if (nonNull.length < 2)
					return fail(400, {
						action: 'editQuestion',
						error: 'Minimal 2 pilihan jawaban untuk soal pilihan ganda.'
					});
				const correctOptionId = resultOptionIds[correctIndex];
				if (!correctOptionId)
					return fail(400, {
						action: 'editQuestion',
						error: 'Pilihan jawaban yang benar tidak valid.'
					});
				if (existingCorrectAnswerId) {
					await serverApi.patch(
						token,
						`/exam/question-correct-answers/${existingCorrectAnswerId}`,
						{
							optionId: correctOptionId
						}
					);
				} else {
					await serverApi.post(token, '/exam/question-correct-answers', {
						questionId,
						optionId: correctOptionId
					});
				}
			} else {
				if (existingCorrectAnswerId)
					await serverApi.delete(
						token,
						`/exam/question-correct-answers/${existingCorrectAnswerId}`
					);
				const allExistingOptionIds = data.getAll('deletedOptionId') as string[];
				const optionCount = Number(data.get('optionCount') ?? 0);
				for (let i = 0; i < optionCount; i++) {
					const existingId = ((data.get(`existingOptionId_${i}`) as string) ?? '').trim();
					if (existingId && !allExistingOptionIds.includes(existingId))
						allExistingOptionIds.push(existingId);
				}
				for (const optId of allExistingOptionIds)
					await serverApi.delete(token, `/exam/options/${optId}`);
			}

			return { action: 'editQuestion', success: true, message: 'Soal berhasil diperbarui.' };
		} catch (e: unknown) {
			return fail(400, { action: 'editQuestion', error: (e as Error).message });
		}
	},

	deleteQuestion: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const examQuestionIds = data.getAll('examQuestionId') as string[];
		const questionId = data.get('questionId') as string;
		try {
			for (const eqId of examQuestionIds)
				await serverApi.delete(token, `/exam/exam-questions/${eqId}`);
			await serverApi.delete(token, `/exam/questions/${questionId}`);
			return {
				action: 'deleteQuestion',
				success: true,
				message: 'Soal berhasil dihapus dari semua ruangan.'
			};
		} catch (e: unknown) {
			return fail(400, { action: 'deleteQuestion', error: (e as Error).message });
		}
	},

	importExcel: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const examRoomIds = formData.getAll('examRoomId') as string[];

		if (!file || file.size === 0)
			return fail(400, { action: 'importExcel', error: 'File Excel wajib dipilih.' });
		if (examRoomIds.length === 0)
			return fail(400, { action: 'importExcel', error: 'Tidak ada ruangan ujian.' });

		try {
			const params = new URLSearchParams();
			examRoomIds.forEach((id) => params.append('examRoomId', id));

			const body = new FormData();
			body.append('file', file);

			const res = await fetch(`${API_URL}/api/v1/exam/questions/import?${params.toString()}`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body
			});
			const json = (await res.json()) as {
				error?: boolean;
				message?: string;
				data?: { created: number; errors: string[] };
			};

			if (!res.ok)
				return fail(400, { action: 'importExcel', error: json.message ?? 'Import gagal.' });

			return {
				action: 'importExcel',
				success: true,
				message: json.data ? `${json.data.created} soal berhasil diimport.` : 'Import selesai.',
				result: json.data
			};
		} catch (e: unknown) {
			return fail(500, { action: 'importExcel', error: (e as Error).message });
		}
	}
};
