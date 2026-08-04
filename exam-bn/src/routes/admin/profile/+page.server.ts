import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { serverApi, BACKEND_URL } from '$lib/server/api';
import type { User } from '$lib/types';

export const actions: Actions = {
	updateProfile: async ({ request, cookies, locals }) => {
		const token = cookies.get('access_token') ?? '';
		const userId = locals.user?.id ?? '';
		const data = await request.formData();
		const fullname = data.get('fullname') as string;
		const username = data.get('username') as string;
		if (!fullname || !username) {
			return fail(400, {
				action: 'updateProfile',
				error: 'Nama lengkap dan username wajib diisi.'
			});
		}
		try {
			await serverApi.patch(token, `/users/${userId}`, { fullname, username });
			cookies.delete('user_data', { path: '/' });
			return { action: 'updateProfile', success: true, message: 'Profil berhasil diperbarui.' };
		} catch (e: unknown) {
			return fail(400, { action: 'updateProfile', error: (e as Error).message });
		}
	},
	changePassword: async ({ request, cookies, locals }) => {
		const token = cookies.get('access_token') ?? '';
		const userId = locals.user?.id ?? '';
		const data = await request.formData();
		const oldPassword = data.get('oldPassword') as string;
		const newPassword = data.get('newPassword') as string;
		const confirmPassword = data.get('confirmPassword') as string;
		if (!oldPassword || !newPassword || !confirmPassword) {
			return fail(400, { action: 'changePassword', error: 'Semua field password wajib diisi.' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, {
				action: 'changePassword',
				error: 'Password baru dan konfirmasi tidak cocok.'
			});
		}
		if (newPassword.length < 6) {
			return fail(400, { action: 'changePassword', error: 'Password baru minimal 6 karakter.' });
		}
		try {
			const currentUser = await serverApi.safeGet<User>(
				token,
				`/users/${userId}`,
				null as unknown as User
			);
			if (!currentUser?.username) {
				return fail(400, {
					action: 'changePassword',
					error: 'Tidak dapat memverifikasi identitas.'
				});
			}
			const loginRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: currentUser.username, password: oldPassword })
			});
			if (!loginRes.ok) {
				return fail(400, { action: 'changePassword', error: 'Password lama tidak sesuai.' });
			}
			await serverApi.patch(token, `/users/${userId}`, { passwordHash: newPassword });
			return { action: 'changePassword', success: true, message: 'Password berhasil diubah.' };
		} catch (e: unknown) {
			return fail(400, { action: 'changePassword', error: (e as Error).message });
		}
	}
};
