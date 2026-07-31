import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

const getApiUrl = (): string => {
	return env.API_URL || publicEnv.PUBLIC_API_URL || 'http://localhost:3000';
};

export const handle: Handle = async ({ event, resolve }) => {
	let accessToken = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('refresh_token');

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
					const data = await refreshRes.json();
					const newAccessToken = data.accessToken || data.access_token;
					if (newAccessToken) {
						accessToken = newAccessToken;
						event.cookies.set('access_token', newAccessToken, {
							path: '/',
							maxAge: 900,
							httpOnly: false,
							sameSite: 'lax'
						});
					}
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
					event.cookies.delete('access_token', { path: '/' });
					event.cookies.delete('refresh_token', { path: '/' });
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

	return resolve(event);
};
