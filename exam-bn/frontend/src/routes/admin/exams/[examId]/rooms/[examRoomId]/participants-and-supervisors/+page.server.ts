import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';

export const actions: Actions = {
	addParticipants: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const examRoomId = data.get('examRoomId') as string;
		const userIds = data.getAll('userId') as string[];

		if (!examRoomId || userIds.length === 0) {
			return fail(400, { action: 'addParticipants', error: 'Minimal pilih satu peserta.' });
		}

		try {
			await Promise.all(
				userIds.map((userId) =>
					serverApi.post(token, '/exam-participants', { examRoomId, userId })
				)
			);
			return { action: 'addParticipants', success: true, message: 'Peserta berhasil ditambahkan.' };
		} catch (e: unknown) {
			return fail(400, { action: 'addParticipants', error: (e as Error).message });
		}
	},
	removeParticipant: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { action: 'removeParticipant', error: 'ID tidak valid.' });
		}

		try {
			await serverApi.delete(token, `/exam-participants/${id}`);
			return { action: 'removeParticipant', success: true, message: 'Peserta berhasil dihapus.' };
		} catch (e: unknown) {
			return fail(400, { action: 'removeParticipant', error: (e as Error).message });
		}
	},
	addRoomMonitors: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const examRoomId = data.get('examRoomId') as string;
		const userIds = data.getAll('userId') as string[];

		if (!examRoomId || userIds.length === 0) {
			return fail(400, { action: 'addRoomMonitors', error: 'Minimal pilih satu pengawas.' });
		}

		try {
			await Promise.all(
				userIds.map((userId) =>
					serverApi.post(token, '/exam-supervisors', { examRoomId, userId })
				)
			);
			return { action: 'addRoomMonitors', success: true, message: 'Pengawas berhasil ditambahkan.' };
		} catch (e: unknown) {
			return fail(400, { action: 'addRoomMonitors', error: (e as Error).message });
		}
	},
	removeRoomMonitor: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { action: 'removeRoomMonitor', error: 'ID tidak valid.' });
		}

		try {
			await serverApi.delete(token, `/exam-supervisors/${id}`);
			return { action: 'removeRoomMonitor', success: true, message: 'Pengawas berhasil dihapus.' };
		} catch (e: unknown) {
			return fail(400, { action: 'removeRoomMonitor', error: (e as Error).message });
		}
	}
};
