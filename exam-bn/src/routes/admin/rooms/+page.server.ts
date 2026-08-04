import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi } from '$lib/server/api';

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const name = data.get('name') as string;
		const capacityStr = data.get('capacity') as string;
		if (!name) {
			return fail(400, { action: 'create', error: 'Nama ruangan wajib diisi.' });
		}
		const body: { name: string; capacity?: number } = { name };
		if (capacityStr) body.capacity = Number(capacityStr);
		try {
			await serverApi.post(token, '/exam/rooms', body);
			return { action: 'create', success: true, message: 'Ruangan berhasil ditambahkan.' };
		} catch (e: unknown) {
			return fail(400, { action: 'create', error: (e as Error).message });
		}
	},
	update: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		const capacityStr = data.get('capacity') as string;
		const body: { name?: string; capacity?: number } = {};
		if (name) body.name = name;
		if (capacityStr) body.capacity = Number(capacityStr);
		try {
			await serverApi.patch(token, `/exam/rooms/${id}`, body);
			return { action: 'update', success: true, message: 'Ruangan berhasil diperbarui.' };
		} catch (e: unknown) {
			return fail(400, { action: 'update', error: (e as Error).message });
		}
	},
	delete: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const id = data.get('id') as string;
		try {
			await serverApi.delete(token, `/exam/rooms/${id}`);
			return { action: 'delete', success: true, message: 'Ruangan berhasil dihapus.' };
		} catch (e: unknown) {
			return fail(400, { action: 'delete', error: (e as Error).message });
		}
	}
};
