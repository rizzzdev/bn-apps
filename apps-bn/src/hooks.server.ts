import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const getApiUrl = (): string => {
	const raw = (env.API_URL || publicEnv.PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
	return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
};

const getCookieDomain = (): string => {
	const raw = publicEnv.PUBLIC_COOKIE_DOMAIN || '';
	if (!raw) return '';
	return raw.trim().replace(/^\.+/, '');
};

export const handle: Handle = async ({ event, resolve }) => {
	let accessToken = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('refresh_token');
	const apiSetCookies: string[] = [];

	const isLoggedIn = !!(accessToken || refreshToken);
	const pathname = event.url.pathname;
	const isLoginPage = pathname === '/login';

	// 1. Guest Route Guard
	if (isLoggedIn && isLoginPage) {
		throw redirect(303, '/');
	}

	// 2. Protected Route Guard (All routes except /login)
	if (!isLoggedIn && !isLoginPage) {
		throw redirect(303, '/login');
	}

	// 3. User Session & Refresh Validation for Logged In User
	if (isLoggedIn) {
		const apiUrl = getApiUrl();

		// Auto Refresh Token if access_token is missing/expired but refresh_token exists
		if (!accessToken && refreshToken) {
			try {
				const refreshRes = await event.fetch(`${apiUrl}/auth/refresh`, {
					method: 'POST',
					headers: {
						'Cookie': `refresh_token=${refreshToken}`
					}
				});

				if (refreshRes.ok) {
					const setCookies = refreshRes.headers.getSetCookie?.() || [];
					apiSetCookies.push(...setCookies);

					const data = await refreshRes.json();
					accessToken = data.accessToken || data.access_token;
				}
			} catch (e) {
				console.error('Server auto-refresh error:', e);
			}
		}

		// Validate User Session (/auth/me)
		if (accessToken) {
			try {
				const userRes = await event.fetch(`${apiUrl}/auth/me`, {
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Cookie': `access_token=${accessToken}`
					}
				});

				if (userRes.ok) {
					const userData = await userRes.json();
					event.locals.user = userData.data?.user || userData.data || userData.user || userData;
					console.log('[Hooks] Authenticated User Session:', event.locals.user);
				} else if (userRes.status === 401 || userRes.status === 403 || userRes.status === 404) {
					console.error(`Token invalid (Status: ${userRes.status}). Logging out...`);
					event.cookies.delete('access_token', { path: '/', ...(getCookieDomain() ? { domain: getCookieDomain() } : {}) });
					event.cookies.delete('refresh_token', { path: '/', ...(getCookieDomain() ? { domain: getCookieDomain() } : {}) });
					if (!isLoginPage) {
						throw redirect(303, '/login');
					}
				} else {
					console.error(`Backend returned ${userRes.status} for /auth/me.`);
				}
			} catch (err) {
				// Handle redirect thrown above
				if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
					throw err;
				}
				console.error('Connection to backend failed in hooks.server.ts:', err);
			}
		}
	}

	const response = await resolve(event);
	for (const header of apiSetCookies) {
		response.headers.append('set-cookie', header);
	}
	return response;
};
