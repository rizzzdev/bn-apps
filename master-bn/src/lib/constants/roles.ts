import { env as publicEnv } from '$env/dynamic/public';

const rawAllowed = (publicEnv as Record<string, string | undefined>).PUBLIC_ALLOWED_ROLES || '';

export const ALLOWED_ROLES: string[] = rawAllowed
	? rawAllowed
			.split(',')
			.map((role) => role.trim())
			.filter(Boolean)
	: ['super_admin'];

export function canAccess(pathname: string, userRoles: string[] = []): boolean {
	if (!Array.isArray(userRoles) || userRoles.length === 0) return false;
	return userRoles.some((role) => ALLOWED_ROLES.includes(role));
}
