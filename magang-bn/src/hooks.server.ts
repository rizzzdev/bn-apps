import { redirect, type Handle } from '@sveltejs/kit';
import { PUBLIC_API_URL, PUBLIC_PORTAL_URL } from '$env/static/public';
import { checkRoleAccess } from '$lib/constants/roles';

/**
 * Pola otentikasi:
 * - access_token: disimpan non-httpOnly agar client (apiClient) bisa menambahkannya ke
 *   header Authorization ketika memanggil API langsung dari browser.
 * - refresh_token: disimpan httpOnly untuk mencegah pencurian via XSS; hanya server
 *   SvelteKit yang dapat membacanya. server-api.ts memanfaatkan cookie ini untuk fetch.
 *
 * Portal login (PUBLIC_PORTAL_URL) bertanggung jawab menyediakan refresh_token awal;
 * hook ini mampu memperbaruinya via /api/v1/auth/refresh dan akan menyalin refresh_token
 * baru ke cookie httpOnly supaya hardening tetap konsisten.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const refreshToken = event.cookies.get('refresh_token');
	let accessToken = event.cookies.get('access_token');

	if (!refreshToken) {
		throw redirect(303, `${PUBLIC_PORTAL_URL}/login`);
	}

	if (refreshToken) {
		let user = null;

		const fetchUser = async (token: string) => {
			try {
				return await fetch(`${PUBLIC_API_URL}/api/v1/auth/me`, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});
			} catch (e) {
				return null;
			}
		};

		let res = accessToken ? await fetchUser(accessToken) : null;

		if (!res || res.status === 401) {
			// Retry mechanism
			let refreshRes = null;
			try {
				refreshRes = await fetch(`${PUBLIC_API_URL}/api/v1/auth/refresh`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${refreshToken}`
					}
				});
			} catch (e) {
				// Backend is unreachable, refreshRes stays null
			}

			if (refreshRes && refreshRes.ok) {
				const refreshData = await refreshRes.json();
				if (!refreshData.error && refreshData.data?.access_token) {
					accessToken = refreshData.data.access_token;
					// access_token tetap non-httpOnly agar FE (apiClient) dapat
					// menambahkannya ke header Authorization untuk fetch langsung.
					// refresh_token disimpan httpOnly untuk mencegah pencurian via XSS.
					// maxAge cookie access_token sengaja pendek (5 menit) agar jendela
					// eksposur saat XSS berkurang; harus <= ACCESS_TOKEN_EXPIRES di api-bn.
					event.cookies.set('access_token', accessToken as string, {
						path: '/',
						httpOnly: false,
						secure: import.meta.env.PROD,
						sameSite: 'lax',
						maxAge: 60 * 5, // 5 minutes (harus <= ACCESS_TOKEN_EXPIRES api-bn)
					});
					const newRefreshToken = (
						refreshData.data as { refresh_token?: unknown }
					).refresh_token;
					if (typeof newRefreshToken === 'string' && newRefreshToken.length > 0) {
						// Refresh token rotation: BE mengembalikan refresh_token baru.
						// Simpan yang baru dan (overwrite) cookie lama.
						event.cookies.set('refresh_token', newRefreshToken, {
							path: '/',
							httpOnly: true,
							secure: import.meta.env.PROD,
							sameSite: 'lax',
							maxAge: 60 * 60 * 24, // 1 day
						});
					}
					// Jika BE tidak mengembalikan refresh_token baru, asumsikan
					// refresh_token lama masih valid (rotation tidak terjadi). Jangan
					// hapus cookie, agar tidak memaksa user re-login padahal sesi
					// sebenarnya masih hidup. Penghapusan refresh_token hanya
					// dilakukan di path failure (lihat blok !user di bawah).
					res = await fetchUser(accessToken as string);
				}
			}
		}

		if (res && res.ok) {
			const result = await res.json();
			if (!result.error && result.data) {
				user = result.data;
				event.locals.user = user;
			}
		}

		if (!user) {
			// Failed to authenticate even after retry
			event.cookies.delete('access_token', { path: '/' });
			event.cookies.delete('refresh_token', { path: '/' });
			throw redirect(303, `${PUBLIC_PORTAL_URL}/login`);
		}

		if (checkRoleAccess(event.url.pathname, user.roles)) {
			throw redirect(303, '/403');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders: () => true
	});
};
