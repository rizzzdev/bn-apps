import { redirect, type Handle } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';

const getCookieDomain = (): string => {
	const raw = (publicEnv as Record<string, string | undefined>).PUBLIC_COOKIE_DOMAIN || '';
	if (!raw) return '';
	return raw.trim().replace(/^\.+/, '');
};

const getApiUrl = (): string => {
	let raw = ((publicEnv as Record<string, string | undefined>).PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
	if (raw.endsWith('/learn')) {
		raw = raw.slice(0, -6).replace(/\/+$/, '');
	}
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
	const apiSetCookies: string[] = [];

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
				const setCookies = refreshRes.headers.getSetCookie?.() || [];
				apiSetCookies.push(...setCookies);

				const refreshData = await refreshRes.json().catch(() => ({}));
				accessToken = refreshData.data?.accessToken || refreshData.accessToken;
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

	const response = await resolve(event, {
		filterSerializedResponseHeaders: () => true
	});
	for (const header of apiSetCookies) {
		response.headers.append('set-cookie', header);
	}
	return response;
};
