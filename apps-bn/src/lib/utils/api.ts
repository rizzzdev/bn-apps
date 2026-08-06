import { env as publicEnv } from '$env/dynamic/public';

export const getApiUrl = (): string => {
	const pub = publicEnv as Record<string, string | undefined>;
	const metaEnv =
		typeof import.meta !== 'undefined' && import.meta.env
			? (import.meta.env as Record<string, string | undefined>)
			: {};
	const raw = (
		pub.API_URL ||
		pub.PUBLIC_API_URL ||
		metaEnv.API_URL ||
		metaEnv.VITE_API_URL ||
		'http://localhost:3000'
	).replace(/\/+$/, '');
	return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
};

export function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	const nameEQ = name + '=';
	const ca = document.cookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
	}
	return null;
}

function getCookieDomain(): string {
	const raw = (publicEnv as Record<string, string | undefined>).PUBLIC_COOKIE_DOMAIN || '';
	if (!raw) return '';
	return raw.trim().replace(/^\.+/, '');
}

function cookieAttrs(): string {
	const domain = getCookieDomain();
	const secure =
		typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
	return `; SameSite=Lax${secure}${domain ? `; domain=${domain}` : ''}`;
}

export function setCookie(name: string, value: string, maxAgeSeconds: number = 900): void {
	if (typeof document === 'undefined') return;
	const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
	document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/${cookieAttrs()}`;
}

export function deleteCookie(name: string): void {
	if (typeof document === 'undefined') return;
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${cookieAttrs()}`;
}

export async function apiClient(endpoint: string, options: RequestInit = {}): Promise<Response> {
	const baseUrl = getApiUrl();
	const url =
		endpoint.startsWith('http://') || endpoint.startsWith('https://')
			? endpoint
			: `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

	const headers = new Headers(options.headers || {});
	const accessToken = getCookie('access_token');

	if (accessToken && !headers.has('Authorization')) {
		headers.set('Authorization', `Bearer ${accessToken}`);
	}

	const fetchOptions: RequestInit = {
		...options,
		headers,
		credentials: options.credentials || 'include'
	};

	let response = await fetch(url, fetchOptions);

	if (response.status === 401 && typeof window !== 'undefined') {
		const refreshUrl = `${baseUrl}/auth/refresh`;
		try {
			const refreshRes = await fetch(refreshUrl, {
				method: 'POST',
				credentials: 'include'
			});

			if (refreshRes.ok) {
				const refreshData = await refreshRes.json().catch(() => ({}));
				const newAccessToken = refreshData.accessToken || refreshData.access_token;
				if (newAccessToken) {
					// Token baru tersedia (browser telah menyimpan Set-Cookie dari api-bn via credentials: 'include')
					headers.set('Authorization', `Bearer ${newAccessToken}`);
				}

				response = await fetch(url, {
					...fetchOptions,
					headers
				});
			} else {
				deleteCookie('access_token');
				deleteCookie('refresh_token');
				window.location.href = '/login';
			}
		} catch {
			deleteCookie('access_token');
			deleteCookie('refresh_token');
			window.location.href = '/login';
		}
	}

	return response;
}
