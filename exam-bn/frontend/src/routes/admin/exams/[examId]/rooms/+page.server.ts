import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';

export const actions: Actions = {
	addRoom: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const examId = data.get('examId') as string;
		const roomId = data.get('roomId') as string;

		if (!examId || !roomId) {
			return fail(400, { error: 'Semua field wajib diisi.' });
		}

		try {
			await serverApi.post(token, '/exam-rooms', { examId, roomId });
			return { success: true, message: 'Ruangan berhasil ditambahkan.' };
		} catch (e: unknown) {
			return fail(400, { error: (e as Error).message });
		}
	},
	updateRoom: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const id = data.get('id') as string;
		const roomId = data.get('roomId') as string;

		if (!id || !roomId) {
			return fail(400, { error: 'Semua field wajib diisi.' });
		}

		try {
			await serverApi.patch(token, `/exam-rooms/${id}`, { roomId });
			return { success: true, message: 'Ruangan berhasil diperbarui.' };
		} catch (e: unknown) {
			return fail(400, { error: (e as Error).message });
		}
	},
	removeRoom: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID tidak valid.' });
		}

		try {
			await serverApi.delete(token, `/exam-rooms/${id}`);
			return { success: true, message: 'Ruangan berhasil dihapus.' };
		} catch (e: unknown) {
			return fail(400, { error: (e as Error).message });
		}
	}
};
