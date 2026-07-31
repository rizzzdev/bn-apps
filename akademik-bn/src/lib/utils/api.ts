import { PUBLIC_API_URL, PUBLIC_PORTAL_URL } from '$env/static/public';
import { toast } from '$lib/stores/toast.svelte';
import { browser } from '$app/environment';

const rawApiUrl = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const BASE_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;
const rawPortalUrl = (PUBLIC_PORTAL_URL || 'http://localhost:5173').replace(/\/+$/, '');
const PORTAL_LOGIN_URL = `${rawPortalUrl}/login`;

function getCookie(name: string): string | null {
	if (!browser) return null;
	const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
}

export function clearAllCookies() {
	if (!browser) return;
	document.cookie.split(';').forEach((c) => {
		document.cookie = c
			.replace(/^ +/, '')
			.replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
	});
}

export async function apiClient(endpoint: string, options: RequestInit = {}): Promise<Response> {
	const token = getCookie('access_token');

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(options.headers as Record<string, string>)
	};
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const isFormData = options.body instanceof FormData;
	if (isFormData) delete headers['Content-Type'];

	const config: RequestInit = {
		...options,
		headers,
		credentials: 'include'
	};

	try {
		const response = await fetch(`${BASE_URL}${endpoint}`, config);

		if (response.status === 401) {
			const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
				method: 'POST',
				credentials: 'include'
			});

			if (refreshRes.ok) {
				const newToken = getCookie('access_token');
				const retryHeaders: Record<string, string> = {
					'Content-Type': 'application/json',
					...(options.headers as Record<string, string>)
				};
				if (newToken) retryHeaders['Authorization'] = `Bearer ${newToken}`;
				if (isFormData) delete retryHeaders['Content-Type'];

				return fetch(`${BASE_URL}${endpoint}`, {
					...options,
					headers: retryHeaders,
					credentials: 'include'
				});
			}

			clearAllCookies();
			toast.error('Sesi berakhir. Silakan login kembali.');
			window.location.href = PORTAL_LOGIN_URL;
			throw new Error('SESSION_EXPIRED');
		}

		return response;
	} catch (error) {
		if (error instanceof Error && error.message === 'SESSION_EXPIRED') throw error;
		toast.error('Gagal terhubung ke server');
		throw error;
	}
}
