import { env as publicEnv } from '$env/dynamic/public';

/**
 * Resolves the backend origin to use for client-side requests.
 */
export function resolveBackendUrl(): string {
	const raw = (publicEnv as Record<string, string | undefined>).PUBLIC_API_URL || 'http://localhost:3000';
	try {
		const configured = new URL(raw);
		const isLoopback = configured.hostname === 'localhost' || configured.hostname === '127.0.0.1';
		if (
			isLoopback &&
			typeof window !== 'undefined' &&
			window.location.hostname !== configured.hostname
		) {
			configured.hostname = window.location.hostname;
		}
		return configured.origin;
	} catch {
		return raw;
	}
}

export function getPortalLoginUrl(): string {
	const portalUrl = (publicEnv as Record<string, string | undefined>).PUBLIC_PORTAL_URL || 'http://localhost:5173';
	return portalUrl.endsWith('/login') ? portalUrl : `${portalUrl.replace(/\/+$/, '')}/login`;
}


