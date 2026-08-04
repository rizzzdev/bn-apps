import { redirect, type Handle } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import { canAccess } from '$lib/constants/roles';

const getCookieDomain = (): string => {
	const raw = (publicEnv as Record<string, string | undefined>).PUBLIC_COOKIE_DOMAIN || '';
	if (!raw) return '';
	return raw.trim().replace(/^\.+/, '');
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
	if (event.url.pathname === '/health') {
		return new Response('OK', { status: 200 });
	}

	let accessToken = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('refresh_token');
	const apiSetCookies: string[] = [];

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
				const setCookies = refreshRes.headers.getSetCookie?.() || [];
				apiSetCookies.push(...setCookies);

				const refreshData = await refreshRes.json().catch(() => ({}));
				accessToken = refreshData.data?.accessToken || refreshData.accessToken;
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

	const response = await resolve(event);
	for (const header of apiSetCookies) {
		response.headers.append('set-cookie', header);
	}
	return response;
};
