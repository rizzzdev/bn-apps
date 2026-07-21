import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { BACKEND_URL } from '$lib/server/api';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const accessToken = cookies.get('access_token');

		if (accessToken) {
			try {
				await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
					method: 'POST',
					headers: { Authorization: `Bearer ${accessToken}` }
				});
			} catch {
				// Backend unreachable — clear cookies anyway
			}
		}

		cookies.delete('access_token', { path: '/' });
		cookies.delete('refresh_token', { path: '/' });
		cookies.delete('user_data', { path: '/' });

		throw redirect(302, '/login');
	}
};
