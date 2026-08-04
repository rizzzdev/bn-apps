import { env as publicEnv } from '$env/dynamic/public';

export const API_URL = (publicEnv as Record<string, string | undefined>).PUBLIC_API_URL ?? 'http://127.0.0.1:3000';

const BASE = API_URL + '/api/v1';

type Params = Record<string, string | number | boolean | undefined>;

async function req<T>(
	token: string,
	path: string,
	init: RequestInit = {},
	params?: Params
): Promise<T> {
	const filtered = params
		? Object.fromEntries(
				Object.entries(params)
					.filter(([, v]) => v !== undefined)
					.map(([k, v]) => [k, String(v)])
			)
		: null;
	const query =
		filtered && Object.keys(filtered).length > 0
			? '?' + new URLSearchParams(filtered).toString()
			: '';
	const res = await fetch(`${BASE}${path}${query}`, {
		...init,
		headers: {
			'Content-Type': 'application/json',
			...init.headers,
			Authorization: `Bearer ${token}`
		}
	});
	const json = await res.json();
	if (res.status === 404 && (!init.method || init.method === 'GET')) return (json.data ?? []) as T;
	if (!res.ok) throw new Error(json.message || 'Request failed');
	return json.data as T;
}

async function safeReq<T>(
	token: string,
	path: string,
	fallback: T,
	init: RequestInit = {},
	params?: Params
): Promise<T> {
	try {
		return await req<T>(token, path, init, params);
	} catch {
		return fallback;
	}
}

export const serverApi = {
	get: <T>(token: string, path: string, params?: Params) => req<T>(token, path, {}, params),
	post: <T>(token: string, path: string, body: unknown) =>
		req<T>(token, path, { method: 'POST', body: JSON.stringify(body) }),
	patch: <T>(token: string, path: string, body: unknown) =>
		req<T>(token, path, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: <T>(token: string, path: string) => req<T>(token, path, { method: 'DELETE' }),
	safeGet: <T>(token: string, path: string, fallback: T, params?: Params) =>
		safeReq<T>(token, path, fallback, {}, params)
};
