import { redirect, type Handle } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import { canAccess } from '$lib/constants/roles';

const getCookieDomain = (): string => {
	const raw = (publicEnv as Record<string, string | undefined>).PUBLIC_COOKIE_DOMAIN || '';
	if (!raw) return '';
	return raw.startsWith('.') ? raw : `.${raw}`;
};

const getApiUrl = (): string => {
	const raw = (
		(publicEnv as Record<string, string | undefined>).PUBLIC_API_URL || 'http://localhost:3000'
	).replace(/\/+$/, '');
	return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
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

	if (!refreshToken) {
		throw redirect(303, getPortalLoginUrl());
	}

	try {
		if (!accessToken && refreshToken) {
			const refreshRes = await event.fetch(`${getApiUrl()}/auth/refresh`, {
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
			const meRes = await event.fetch(`${getApiUrl()}/auth/me`, {
				headers: {
					Authorization: `Bearer ${accessToken}`
				}
			});

			if (meRes.ok) {
				const meData = await meRes.json();
				const user = meData.data || meData;
				event.locals.user = user;

				if (!canAccess(event.url.pathname, user?.roles ?? [])) {
					event.locals.accessDenied = true;
				}
			} else {
				clearAuthCookies(event);
				throw redirect(303, getPortalLoginUrl());
			}
		} else {
			clearAuthCookies(event);
			throw redirect(303, getPortalLoginUrl());
		}
	} catch (error) {
		if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
			throw error;
		}
		clearAuthCookies(event);
		throw redirect(303, getPortalLoginUrl());
	}

	return resolve(event);
};
