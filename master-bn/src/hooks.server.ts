import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { env as envPrivate } from '$env/dynamic/private';

const getCookieDomain = (): string => {
	const raw = env.PUBLIC_COOKIE_DOMAIN || '';
	if (!raw) return '';
	return raw.startsWith('.') ? raw : `.${raw}`;
};

export const handle: Handle = async ({ event, resolve }) => {
	let accessToken = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('sentri-session') || event.cookies.get('refresh_token');

	const isLoggedIn = !!(accessToken || refreshToken);
	const isForbiddenPage = event.url.pathname === '/403';

	const portalUrl = env.PUBLIC_PORTAL_URL || 'http://localhost:5173';
	const portalLoginUrl = portalUrl.endsWith('/login')
		? portalUrl
		: `${portalUrl.replace(/\/+$/, '')}/login`;

	if (!isLoggedIn) {
		throw redirect(303, portalLoginUrl);
	}

	try {
		// Using dynamic env to avoid build-time static replacement issues in server hooks if not configured
		const apiUrl = env.PUBLIC_API_URL || 'http://localhost:9091/api/v1';

		if (!accessToken && refreshToken) {
			const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `refresh_token=${refreshToken}`
				}
			});

			if (refreshRes.ok) {
				const refreshData = await refreshRes.json().catch(() => ({}));
				let newAccessToken = refreshData.data?.accessToken || refreshData.accessToken;

				const setCookies = refreshRes.headers.getSetCookie?.() || [];
				for (const cookie of setCookies) {
					if (cookie.startsWith('access_token=')) {
						newAccessToken = cookie.split(';')[0].split('=')[1];
					} else if (cookie.startsWith('refresh_token=')) {
						const val = cookie.split(';')[0].split('=')[1];
						event.cookies.set('refresh_token', val, {
							path: '/',
							maxAge: 86400 * 7,
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
						sameSite: 'lax',
						secure: import.meta.env.PROD,
						...(getCookieDomain() ? { domain: getCookieDomain() } : {})
					});
				}
			}
		}

		const res = await fetch(`${apiUrl}/auth/me`, {
			headers: {
				Authorization: `Bearer ${accessToken || refreshToken}`
			}
		});

		if (res.ok) {
			const data = await res.json();
			const user = data.data || data;

			event.locals.user = user;

			const isAdmin = user?.roles?.includes('super_admin');

			if (!isAdmin && !isForbiddenPage) {
				throw redirect(303, '/403');
			}

			if (isAdmin && isForbiddenPage) {
				throw redirect(303, '/');
			}
		} else {
			event.cookies.delete('sentri-session', { path: '/', ...(getCookieDomain() ? { domain: getCookieDomain() } : {}) });
			event.cookies.delete('refresh_token', { path: '/', ...(getCookieDomain() ? { domain: getCookieDomain() } : {}) });
			event.cookies.delete('access_token', { path: '/', ...(getCookieDomain() ? { domain: getCookieDomain() } : {}) });
			throw redirect(303, portalLoginUrl);
		}
	} catch (error) {
		if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
			throw error; // Rethrow SvelteKit redirects
		}
		console.error('Failed to authenticate user:', error);
		event.cookies.delete('sentri-session', { path: '/', ...(getCookieDomain() ? { domain: getCookieDomain() } : {}) });
		event.cookies.delete('refresh_token', { path: '/', ...(getCookieDomain() ? { domain: getCookieDomain() } : {}) });
		event.cookies.delete('access_token', { path: '/', ...(getCookieDomain() ? { domain: getCookieDomain() } : {}) });
		throw redirect(303, portalLoginUrl);
	}

	return resolve(event);
};

export const handleFetch: import('@sveltejs/kit').HandleFetch = async ({ request, fetch }) => {
	if (envPrivate.INTERNAL_API_BASE && request.url.startsWith('http://localhost:9091')) {
		request = new Request(
			request.url.replace('http://localhost:9091', envPrivate.INTERNAL_API_BASE),
			request
		);
	}
	return fetch(request);
};
