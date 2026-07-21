import { PUBLIC_API_URL } from '$env/static/public';
import { goto } from '$app/navigation';
import { toast } from '$lib/stores/toast.svelte';

export function getCookie(name: string) {
	if (typeof document === 'undefined') return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
	return null;
}

export function setCookie(name: string, value: string, maxAgeSeconds: number) {
	if (typeof document !== 'undefined') {
		document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
	}
}

export function deleteCookie(name: string) {
	if (typeof document !== 'undefined') {
		document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
	}
}

export const apiClient = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
	let accessToken = getCookie('access_token');
	
	const isFormData = options.body instanceof FormData;
	const headers: Record<string, string> = {
		...(isFormData ? {} : { 'Content-Type': 'application/json' }),
		...(options.headers as Record<string, string> || {})
	};

	if (accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`;
	}

	const config: RequestInit = {
		...options,
		headers,
		credentials: 'include'
	};

	let response = await fetch(`${PUBLIC_API_URL}${endpoint}`, config);

	// Pengecekan token expired (biasanya 401 Unauthorized)
	if (response.status === 401) {
		try {
			// Mencoba refresh token
			const refreshRes = await fetch(`${PUBLIC_API_URL}/auth/refresh`, {
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
					// Simpan accessToken baru (jika belum tersimpan atau untuk perpanjang max-age)
					setCookie('access_token', newAccessToken, 900); // 15 mins
				}

				if (newAccessToken) {
					// Retry request asli dengan token baru
					headers['Authorization'] = `Bearer ${newAccessToken}`;
					response = await fetch(`${PUBLIC_API_URL}${endpoint}`, {
						...config,
						headers
					});
				} else {
					throw new Error('Refresh token gagal, token baru tidak ditemukan');
				}
			} else {
				throw new Error('Refresh token gagal');
			}
		} catch (error) {
			// Jika refresh gagal, hapus token dan redirect ke login
			deleteCookie('access_token');
			if (typeof window !== 'undefined') {
				toast.error('Your session is over, please relogin!');
				goto('/login');
			}
			return response;
		}
	}

	return response;
};
