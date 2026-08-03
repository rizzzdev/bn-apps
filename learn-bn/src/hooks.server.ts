import { redirect, type Handle } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';

const getCookieDomain = (): string => {
	const raw = (publicEnv as Record<string, string | undefined>).PUBLIC_COOKIE_DOMAIN || '';
	if (!raw) return '';
	return raw.startsWith('.') ? raw : `.${raw}`;
};

const getApiUrl = (): string => {
	const raw = (publicEnv as Record<string, string | undefined>).PUBLIC_API_URL || 'http://localhost:3000';
	const match = raw.match(/^(https?:\/\/[^/]+(?:\/api\/v1)?)/i);
	if (match) {
		const base = match[1].replace(/\/+$/, '');
		return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
	}
	return 'http://localhost:3000/api/v1';
};

const getPortalLoginUrl = (): string => {
	const raw = (
		(publicEnv as Record<string, string | undefined>).PUBLIC_PORTAL_URL || 'http://localhost:5173'
	).replace(/\/+$/, '');
	return raw.endsWith('/login') ? raw : `${raw}/login`;
};

const clearAuthCookies = (event: Parameters<Handle>[0]['event']) => {
	const base = { path: '/', ...(getCookieDomain() ? { domain: getCookieDomain() } : {}) };
	event.cookies.delete('access_token', base);
	event.cookies.delete('refresh_token', base);
	event.cookies.delete('sentri-session', base);
};

export const handle: Handle = async ({ event, resolve }) => {
	let accessToken = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('refresh_token');

	if (!accessToken && !refreshToken) {
		throw redirect(303, getPortalLoginUrl());
	}

	const apiUrl = getApiUrl();

	try {
		if (!accessToken && refreshToken) {
			const refreshRes = await event.fetch(`${apiUrl}/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `refresh_token=${refreshToken}`
				}
			});

			if (refreshRes.ok) {
				const refreshData = await refreshRes.json().catch(() => ({}));
				const newAccessToken = refreshData.data?.accessToken || refreshData.accessToken;

				const setCookies = refreshRes.headers.getSetCookie?.() || [];
				for (const cookie of setCookies) {
					if (cookie.startsWith('refresh_token=')) {
						const val = cookie.split(';')[0].split('=')[1];
						event.cookies.set('refresh_token', val, {
							path: '/',
							maxAge: 86400 * 7,
							httpOnly: true,
							sameSite: 'lax',
							secure: import.meta.env.PROD,
							...(getCookieDomain() ? { domain: getCookieDomain() } : {})
						});
					}
				}

				if (newAccessToken) {
					accessToken = newAccessToken;
					event.cookies.set('access_token', newAccessToken, {
						path: '/',
						maxAge: 900,
						httpOnly: false,
						sameSite: 'lax',
						secure: import.meta.env.PROD,
						...(getCookieDomain() ? { domain: getCookieDomain() } : {})
					});
				}
			}
		}

		if (accessToken) {
			const meRes = await event.fetch(`${apiUrl}/auth/me`, {
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			});

			if (meRes.ok) {
				const meData = await meRes.json();
				const user = meData.data?.user || meData.data || meData.user || meData;
				event.locals.user = user;
			} else if (meRes.status === 401 || meRes.status === 403) {
				clearAuthCookies(event);
				throw redirect(303, getPortalLoginUrl());
			} else {
				console.error(`[Hooks] Backend returned status ${meRes.status} for /auth/me`);
			}
		} else {
			clearAuthCookies(event);
			throw redirect(303, getPortalLoginUrl());
		}
	} catch (error) {
		if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
			throw error;
		}
		console.error('[Hooks] Auth error in hooks.server.ts:', error);
	}

	return resolve(event, {
		filterSerializedResponseHeaders: () => true
	});
};
