import { redirect, isRedirect } from '@sveltejs/kit';
import { ensureAccessToken, SessionExpiredError } from './utils/access-token';
import { resolveBackendUrl } from './utils/backend-url';

const BASE = resolveBackendUrl() + '/api/v1';

type Params = Record<string, string | number | boolean | undefined>;
type FetchFn = typeof fetch;

async function req<T>(
	fetchFn: FetchFn,
	path: string,
	init: RequestInit = {},
	params?: Params
): Promise<T> {
	let token: string;
	try {
		token = await ensureAccessToken(fetchFn);
	} catch (err) {
		if (err instanceof SessionExpiredError) throw redirect(302, '/login');
		throw err;
	}

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
	const res = await fetchFn(`${BASE}${path}${query}`, {
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
	fetchFn: FetchFn,
	path: string,
	fallback: T,
	init: RequestInit = {},
	params?: Params
): Promise<T> {
	try {
		return await req<T>(fetchFn, path, init, params);
	} catch (err) {
		if (isRedirect(err)) throw err; // session expired — let SvelteKit redirect to /login
		return fallback;
	}
}

export const api = {
	get: <T>(fetchFn: FetchFn, path: string, params?: Params) => req<T>(fetchFn, path, {}, params),
	post: <T>(fetchFn: FetchFn, path: string, body: unknown) =>
		req<T>(fetchFn, path, { method: 'POST', body: JSON.stringify(body) }),
	patch: <T>(fetchFn: FetchFn, path: string, body: unknown) =>
		req<T>(fetchFn, path, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: <T>(fetchFn: FetchFn, path: string) => req<T>(fetchFn, path, { method: 'DELETE' }),
	safeGet: <T>(fetchFn: FetchFn, path: string, fallback: T, params?: Params) =>
		safeReq<T>(fetchFn, path, fallback, {}, params)
};
