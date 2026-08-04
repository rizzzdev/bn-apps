import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi, BACKEND_URL } from '$lib/server/api';

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const fullname = data.get('fullname') as string;
		const username = data.get('username') as string;
		const password = data.get('password') as string;
		const role = data.get('role') as string;
		if (!fullname || !username || !password || !role) {
			return fail(400, { action: 'create', error: 'Semua field wajib diisi.' });
		}
		try {
			await serverApi.post(token, '/users', { fullname, username, passwordHash: password, role });
			return { action: 'create', success: true, message: 'User berhasil ditambahkan.' };
		} catch (e: unknown) {
			return fail(400, { action: 'create', error: (e as Error).message });
		}
	},
	importExcel: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const file = data.get('file') as File | null;
		const role = data.get('role') as string;
		if (!file || file.size === 0) {
			return fail(400, { action: 'importExcel', error: 'File Excel wajib dipilih.' });
		}
		if (!role) {
			return fail(400, { action: 'importExcel', error: 'Role wajib dipilih.' });
		}
		try {
			const form = new FormData();
			form.append('file', new Blob([await file.arrayBuffer()], { type: file.type }), file.name);
			form.append('role', role);
			const res = await fetch(`${BACKEND_URL}/api/v1/users/import`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
				body: form
			});
			const json = (await res.json()) as {
				data?: { created: number; errors: string[] };
				message?: string;
			};
			if (!res.ok)
				return fail(400, { action: 'importExcel', error: json.message ?? 'Import gagal.' });
			return {
				action: 'importExcel',
				success: true,
				message: `${json.data?.created ?? 0} user berhasil diimport.`,
				result: json.data
			};
		} catch (e: unknown) {
			return fail(400, { action: 'importExcel', error: (e as Error).message });
		}
	},
	update: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const id = data.get('id') as string;
		const body: Record<string, string> = {};
		const fullname = data.get('fullname') as string;
		const username = data.get('username') as string;
		const password = data.get('password') as string;
		const role = data.get('role') as string;
		if (fullname) body.fullname = fullname;
		if (username) body.username = username;
		if (password) body.passwordHash = password;
		if (role) body.role = role;
		try {
			await serverApi.patch(token, `/users/${id}`, body);
			return { action: 'update', success: true, message: 'User berhasil diperbarui.' };
		} catch (e: unknown) {
			return fail(400, { action: 'update', error: (e as Error).message });
		}
	},
	delete: async ({ request, cookies }) => {
		const token = cookies.get('access_token') ?? '';
		const data = await request.formData();
		const id = data.get('id') as string;
		try {
			await serverApi.delete(token, `/users/${id}`);
			return { action: 'delete', success: true, message: 'User berhasil dihapus.' };
		} catch (e: unknown) {
			return fail(400, { action: 'delete', error: (e as Error).message });
		}
	}
};
