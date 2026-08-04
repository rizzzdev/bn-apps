import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';

export const actions: Actions = {
	// List view actions
	create: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const startTime = data.get('startTime') as string;
		const endTime = data.get('endTime') as string;
		const questionCreatorId = data.get('questionCreatorId') as string;
		const passingGradeRaw = data.get('passingGrade') as string;
		if (!name || !startTime || !endTime) {
			return fail(400, {
				action: 'create',
				error: 'Nama, waktu mulai, dan waktu selesai wajib diisi.'
			});
		}
		try {
			await serverApi.post(token, '/exam/exams', {
				name,
				description: description || undefined,
				questionCreatorId: questionCreatorId || undefined,
				startTime: new Date(startTime + ':00+07:00').toISOString(),
				endTime: new Date(endTime + ':00+07:00').toISOString(),
				passingGrade: passingGradeRaw ? parseFloat(passingGradeRaw) : undefined
			});
			return { action: 'create', success: true, message: 'Ujian berhasil dibuat.' };
		} catch (e: unknown) {
			return fail(400, { action: 'create', error: (e as Error).message });
		}
	},
	update: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const startTime = data.get('startTime') as string;
		const endTime = data.get('endTime') as string;
		const questionCreatorId = data.get('questionCreatorId') as string;
		const passingGradeRaw = data.get('passingGrade') as string;
		const body: Record<string, string | number | undefined> = {};
		if (name) body.name = name;
		if (description !== null) body.description = description || undefined;
		if (questionCreatorId !== null) body.questionCreatorId = questionCreatorId || undefined;
		if (startTime) body.startTime = new Date(startTime + ':00+07:00').toISOString();
		if (endTime) body.endTime = new Date(endTime + ':00+07:00').toISOString();
		if (passingGradeRaw) body.passingGrade = parseFloat(passingGradeRaw);
		try {
			await serverApi.patch(token, `/exam/exams/${id}`, body);
			return { action: 'update', success: true, message: 'Ujian berhasil diperbarui.' };
		} catch (e: unknown) {
			return fail(400, { action: 'update', error: (e as Error).message });
		}
	},
	delete: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const id = data.get('id') as string;
		try {
			await serverApi.delete(token, `/exam/exams/${id}`);
			return { action: 'delete', success: true, message: 'Ujian berhasil dihapus.' };
		} catch (e: unknown) {
			return fail(400, { action: 'delete', error: (e as Error).message });
		}
	}
};
