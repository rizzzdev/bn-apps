import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { BACKEND_URL } from '$lib/server/api';
import { isSecureRequest } from '$lib/server/cookie-options';

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const secure = isSecureRequest(url);
		const form = await request.formData();
		const username = form.get('username') as string;
		const password = form.get('password') as string;

		if (!username || !password) {
			return fail(400, { error: 'Username dan password wajib diisi.' });
		}

		let res: Response;
		try {
			res = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
		} catch {
			return fail(503, { error: 'Tidak dapat terhubung ke server. Coba lagi nanti.' });
		}

		const json = await res.json();

		if (!res.ok) {
			return fail(res.status, { error: json.message || 'Login gagal.' });
		}

		const { accessToken, refreshToken, user } = json.data;

		cookies.set('access_token', accessToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure,
			maxAge: 60 * 15 // 15 minutes
		});

		cookies.set('refresh_token', refreshToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure,
			maxAge: 60 * 60 * 24 // 1 day
		});

		cookies.set(
			'user_data',
			JSON.stringify({
				id: user.id,
				fullname: user.fullname,
				username: user.username,
				role: user.role
			}),
			{
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure,
				maxAge: 60 * 15
			}
		);

		const role: string = user.role;
		if (role === 'ADMIN') throw redirect(302, '/admin');
		if (role === 'SUPERVISOR') throw redirect(302, '/supervisor');
		throw redirect(302, '/participant');
	}
};
