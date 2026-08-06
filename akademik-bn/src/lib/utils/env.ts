import { env as publicEnv } from '$env/dynamic/public';

function dynamicVar(name: string): string {
	return ((publicEnv as Record<string, string | undefined>)[name] ?? '').trim();
}

/** Domain cookie bersama (tanpa titik di depan) untuk sesi lintas subdomain, mis. 'bn-apps.local'. */
export function getCookieDomain(): string {
	const raw = dynamicVar('PUBLIC_COOKIE_DOMAIN');
	if (!raw) return '';
	return raw.replace(/^\.+/, '');
}

/** Base URL API yang selalu berakhiran `/api/v1`. */
export function getApiBaseUrl(): string {
	const raw = (dynamicVar('PUBLIC_API_URL') || 'http://localhost:3000').replace(/\/+$/, '');
	return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
}

/** URL dasar portal (tanpa `/login`), mis. untuk tombol 'Kembali ke Portal'. */
export function getPortalUrl(): string {
	const raw = (dynamicVar('PUBLIC_PORTAL_URL') || 'http://localhost:5173').replace(/\/+$/, '');
	return raw.endsWith('/login') ? raw.slice(0, -'/login'.length) : raw;
}

/** URL halaman login portal (anti-duplikasi `/login/login`). */
export function getPortalLoginUrl(): string {
	const raw = (dynamicVar('PUBLIC_PORTAL_URL') || 'http://localhost:5173').replace(/\/+$/, '');
	return raw.endsWith('/login') ? raw : `${raw}/login`;
}
