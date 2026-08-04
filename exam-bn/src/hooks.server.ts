import { redirect, type Handle, type HandleFetch } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { UserProfile } from './app';
import { parseJwtPayload } from '$lib/utils/jwt';

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

const dashboardForRole = (role?: string): string | null => {
	if (role === 'super_admin') return '/admin';
	if (role === 'teacher') return '/supervisor';
	if (role === 'student') return '/participant';
	return null;
};

const resolveRole = (rawUser: Record<string, unknown>): string => {
	if (Array.isArray(rawUser.roles) && rawUser.roles.length > 0) {
		if (rawUser.roles.includes('super_admin')) return 'super_admin';
		if (rawUser.roles.includes('teacher')) return 'teacher';
		if (rawUser.roles.includes('student')) return 'student';
		return String(rawUser.roles[0]);
	}
	if (typeof rawUser.role === 'string' && rawUser.role) {
		return rawUser.role;
	}
	return '';
};

function clearAuthCookies(event: Parameters<Handle>[0]['event']) {
	const domain = getCookieDomain();
	const opts = { path: '/', ...(domain ? { domain } : {}) };
	event.cookies.delete('access_token', opts);
	event.cookies.delete('refresh_token', opts);
	event.cookies.delete('user_data', opts);
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const token = event.cookies.get('access_token');
	const refreshToken = event.cookies.get('refresh_token');

	let apiSetCookies: string[] = [];

	try {
		let effectiveToken = token;

		if (!effectiveToken && refreshToken) {
			const refRes = await fetch(`${getApiUrl()}/auth/refresh-token`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken })
			});
			if (refRes.ok) {
				const refData = await refRes.json();
				effectiveToken = refData.data?.accessToken;
				const sc = refRes.headers.getSetCookie();
				if (sc && sc.length > 0) apiSetCookies = sc;
			}
		}

		if (effectiveToken) {
			const jwtPayload = parseJwtPayload(effectiveToken);
			let rawUser: Record<string, unknown> | null = (jwtPayload as Record<string, unknown>) ?? null;

			if (!rawUser) {
				const userDataCookie = event.cookies.get('user_data');
				if (userDataCookie) {
					try {
						rawUser = JSON.parse(userDataCookie);
					} catch {
						rawUser = null;
					}
				}
			}

			if (rawUser) {
				const role = resolveRole(rawUser);
				const rawRoles: string[] = Array.isArray(rawUser.roles)
					? rawUser.roles.map(String)
					: typeof rawUser.role === 'string' && rawUser.role
						? [rawUser.role]
						: role
							? [role]
							: [];

				const user: UserProfile = {
					id: String(rawUser.id || rawUser.userId || rawUser.sub || ''),
					fullname: String(rawUser.fullname || rawUser.name || ''),
					email: rawUser.email ? String(rawUser.email) : null,
					role: role as 'super_admin' | 'teacher' | 'student',
					roles: rawRoles,
					...rawUser
				};

				event.locals.user = user;

				const allowedRolesStr =
					(publicEnv as Record<string, string | undefined>).PUBLIC_ALLOWED_ROLES ||
					'super_admin,teacher,student';
				const allowedRoles = allowedRolesStr
					.split(',')
					.map((r) => r.trim())
					.filter(Boolean);

				const userRoles: string[] =
					user.roles && user.roles.length > 0 ? user.roles : user.role ? [user.role] : [];
				const hasAllowedRole = userRoles.some((r) => allowedRoles.includes(r));

				if (!hasAllowedRole) {
					event.locals.accessDenied = true;
				} else {
					// Role-based route guards
					if (path === '/' || path === '') {
						const targetDashboard = dashboardForRole(user.role);
						if (targetDashboard) {
							throw redirect(303, targetDashboard);
						} else {
							event.locals.accessDenied = true;
						}
					} else if (path.startsWith('/admin') && !userRoles.includes('super_admin')) {
						event.locals.accessDenied = true;
					} else if (path.startsWith('/supervisor') && !userRoles.includes('teacher')) {
						event.locals.accessDenied = true;
					} else if (path.startsWith('/participant') && !userRoles.includes('student')) {
						event.locals.accessDenied = true;
					} else {
						event.locals.accessDenied = false;
					}
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

export const handleFetch: HandleFetch = async ({ request, fetch }) => {
	if (privateEnv.INTERNAL_API_BASE && request.url.startsWith('http://localhost:9091')) {
		request = new Request(
			request.url.replace('http://localhost:9091', privateEnv.INTERNAL_API_BASE),
			request
		);
	}
	return fetch(request);
};

