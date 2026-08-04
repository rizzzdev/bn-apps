import { redirect, type Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isSecureRequest } from '$lib/server/cookie-options';

const API = (env.BACKEND_URL ?? 'http://127.0.0.1:3000') + '/api/v1';
const FETCH_TIMEOUT_MS = 5000;
const USER_CACHE_MAX_AGE = 60 * 15; // same as access_token TTL

function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function dashboardForRole(role: string): string {
	if (role === 'ADMIN') return '/admin';
	if (role === 'SUPERVISOR') return '/supervisor';
	return '/participant';
}

async function getUser(accessToken: string): Promise<UserProfile | null> {
	try {
		const res = await fetchWithTimeout(`${API}/auth/me`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});
		if (!res.ok) return null;
		const json = await res.json();
		return json.data as UserProfile;
	} catch {
		return null;
	}
}

async function tryRefresh(refreshToken: string): Promise<string | null> {
	try {
		const res = await fetchWithTimeout(`${API}/auth/access-token`, {
			method: 'POST',
			headers: { Cookie: `refresh_token=${refreshToken}` }
		});
		if (!res.ok) return null;
		const json = await res.json();
		return (json.data?.accessToken as string) ?? null;
	} catch {
		return null;
	}
}

function setAccessToken(event: Parameters<Handle>[0]['event'], token: string) {
	event.cookies.set('access_token', token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: isSecureRequest(event.url),
		maxAge: USER_CACHE_MAX_AGE
	});
}

function setCachedUser(event: Parameters<Handle>[0]['event'], user: UserProfile) {
	event.cookies.set('user_data', JSON.stringify(user), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: isSecureRequest(event.url),
		maxAge: USER_CACHE_MAX_AGE
	});
}

function clearUserCache(event: Parameters<Handle>[0]['event']) {
	event.cookies.delete('user_data', { path: '/' });
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const accessToken = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('refresh_token');
	const cachedUserData = event.cookies.get('user_data');

	// ── Login page ──────────────────────────────────────────────────────────
	if (path === '/login') {
		if (accessToken && cachedUserData) {
			let cachedUser: UserProfile | null = null;
			try {
				cachedUser = JSON.parse(cachedUserData) as UserProfile;
			} catch {
				/* invalid cache */
			}
			if (cachedUser) throw redirect(302, dashboardForRole(cachedUser.role));
		}
		if (accessToken) {
			const user = await getUser(accessToken);
			if (user) throw redirect(302, dashboardForRole(user.role));
		}
		return resolve(event);
	}

	// ── All other protected pages ────────────────────────────────────────────
	if (!accessToken && !refreshToken) throw redirect(302, '/login');

	let currentToken = accessToken;
	let user: UserProfile | null = null;

	// Fast path: use cached user_data if access_token is still valid (saves /auth/me round-trip)
	if (currentToken && cachedUserData) {
		try {
			user = JSON.parse(cachedUserData) as UserProfile;
		} catch {
			/* fall through */
		}
	}

	// Silently refresh when access token is missing but refresh token exists
	if (!currentToken && refreshToken) {
		const newToken = await tryRefresh(refreshToken);
		if (!newToken) throw redirect(302, '/login');
		currentToken = newToken;
		setAccessToken(event, currentToken);
		user = null; // force re-fetch after token refresh
	}

	// Fetch user from API if not served from cache
	if (!user && currentToken) {
		user = await getUser(currentToken);

		// Access token rejected — try refreshing once
		if (!user && refreshToken) {
			const newToken = await tryRefresh(refreshToken);
			if (!newToken) throw redirect(302, '/login');
			user = await getUser(newToken);
			if (!user) throw redirect(302, '/login');
			currentToken = newToken;
			setAccessToken(event, currentToken);
		}

		if (user) setCachedUser(event, user);
		else clearUserCache(event);
	}

	if (!user) throw redirect(302, '/login');

	event.locals.user = user;

	// Role-based guards
	if (path === '/' || path === '') throw redirect(302, dashboardForRole(user.role));
	if (path.startsWith('/admin') && user.role !== 'ADMIN') throw redirect(302, '/login');
	if (path.startsWith('/supervisor') && user.role !== 'SUPERVISOR') throw redirect(302, '/login');
	if (path.startsWith('/participant') && user.role !== 'PARTICIPANT') throw redirect(302, '/login');

	return resolve(event);
};
