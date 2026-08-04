import { PUBLIC_API_URL, PUBLIC_PORTAL_URL } from '$env/static/public';
import { env as publicEnv } from '$env/dynamic/public';
import { toast } from '$lib/stores/toast.svelte';

export function getCookie(name: string) {
	if (typeof document === 'undefined') return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
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

export function setCookie(name: string, value: string, maxAgeSeconds: number) {
	if (typeof document !== 'undefined') {
		document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}${cookieAttrs()}`;
	}
}

export function deleteCookie(name: string) {
	if (typeof document !== 'undefined') {
		document.cookie = `${name}=; path=/; max-age=0${cookieAttrs()}`;
	}
}

export function getApiBaseUrl(): string {
	const raw = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
	return raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
}

export const apiClient = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
	const accessToken = getCookie('access_token');
	const baseUrl = getApiBaseUrl();

	let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	if (!path.startsWith('/master') && !path.startsWith('/auth')) {
		path = `/master${path}`;
	}

	const isFormData = options.body instanceof FormData;
	const headers: Record<string, string> = {
		...(isFormData ? {} : { 'Content-Type': 'application/json' }),
		...((options.headers as Record<string, string>) || {})
	};

	if (accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`;
	}

	const config: RequestInit = {
		...options,
		headers,
		credentials: 'include'
	};

	let response = await fetch(`${baseUrl}${path}`, config);

	// Pengecekan token expired (biasanya 401 Unauthorized)
	if (response.status === 401) {
		try {
			// Mencoba refresh token
			const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});

			const refreshData = await refreshRes.json();

			if (refreshRes.ok && !refreshData.error) {
				// Coba ambil dari response JSON
				let newAccessToken = refreshData.data?.accessToken || refreshData.accessToken;

				// Jika tidak ada di JSON, mungkin API set via header tapi fetch tak tangkap
				if (!newAccessToken) {
					newAccessToken = getCookie('access_token');
				}

				if (newAccessToken) {
					// Token baru tersedia (browser juga telah menyimpan Set-Cookie dari api-bn via credentials: 'include')
				}

				if (newAccessToken) {
					// Retry request asli dengan token baru
					headers['Authorization'] = `Bearer ${newAccessToken}`;
					response = await fetch(`${baseUrl}${path}`, {
						...config,
						headers
					});
				} else {
					throw new Error('Refresh token gagal, token baru tidak ditemukan');
				}
			} else {
				throw new Error('Refresh token gagal');
			}
		} catch {
			// Jika refresh gagal, hapus token dan redirect ke portal login
			deleteCookie('access_token');
			if (typeof window !== 'undefined') {
				toast.error('Your session is over, please relogin!');
				const portalUrl = PUBLIC_PORTAL_URL || 'http://localhost:5173';
				const portalLoginUrl = portalUrl.endsWith('/login')
					? portalUrl
					: `${portalUrl.replace(/\/+$/, '')}/login`;
				window.location.href = portalLoginUrl;
			}
			return response;
		}
	}

	return response;
};
