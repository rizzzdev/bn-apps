import { redirect, type Handle } from '@sveltejs/kit';
import { PUBLIC_MASTER_API_URL } from '$env/static/public';
import { ROLE_PATHS } from '$lib/constants/roles';

export const handle: Handle = async ({ event, resolve }) => {
	const refreshToken = event.cookies.get('refresh_token');
	let accessToken = event.cookies.get('access_token');
	
	const isLoginPage = event.url.pathname.startsWith('/login');

	if (!refreshToken && !isLoginPage) {
		throw redirect(303, '/login');
	}

	if (refreshToken && isLoginPage) {
		throw redirect(303, '/');
	}

	if (refreshToken && !isLoginPage) {
		let user = null;
		
		const fetchUser = async (token: string) => {
			try {
				return await fetch(`${PUBLIC_MASTER_API_URL}/api/v1/auth/me`, {
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
				refreshRes = await fetch(`${PUBLIC_MASTER_API_URL}/api/v1/auth/refresh`, {
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
					event.cookies.set('access_token', accessToken as string, {
						path: '/',
						httpOnly: false, // Accessible to client-side apiClient if needed
						secure: import.meta.env.PROD,
						sameSite: 'lax',
						maxAge: 60 * 60 // 1 hour
					});
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
			throw redirect(303, '/login');
		}

		// RBAC Check
		const pathname = event.url.pathname;
		let requiresRole = '';
		for (const [pathPrefix, role] of Object.entries(ROLE_PATHS)) {
			if (pathname.startsWith(pathPrefix)) {
				requiresRole = role;
				break;
			}
		}

		if (requiresRole && !user.roles.includes(requiresRole)) {
			throw redirect(303, '/403');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders: () => true
	});
};
