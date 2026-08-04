import { resolveBackendUrl } from './backend-url';

const BASE = resolveBackendUrl() + '/api/v1';

// Access token is kept in localStorage so it survives a page reload — the backend only keeps
// ONE active session token per user in Redis (overwritten on every refresh), so a copy that
// disappears on reload would force a refresh on every load and invalidate whatever token the
// rest of the app (cookie-based, used by sockets/chat) was still holding. It is never sent
// automatically by the browser (unlike a cookie), so it's only attached where we explicitly
// add the Authorization header.
const STORAGE_KEY = 'exam_bn_access_token';

function hasLocalStorage(): boolean {
	return typeof localStorage !== 'undefined';
}

export function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
	return null;
}

export function getAccessToken(): string | null {
	const cookieToken = getCookie('access_token');
	if (cookieToken) return cookieToken;
	if (!hasLocalStorage()) return null;
	return localStorage.getItem(STORAGE_KEY);
}


export function setAccessToken(token: string | null): void {
	if (!hasLocalStorage()) return;
	if (token) localStorage.setItem(STORAGE_KEY, token);
	else localStorage.removeItem(STORAGE_KEY);
}

export function clearAccessToken(): void {
	setAccessToken(null);
}

/** Treat the token as expired slightly before its real `exp` to avoid races with in-flight requests. */
const EXPIRY_BUFFER_MS = 5000;

function decodeExpMs(token: string): number | null {
	try {
		const payload = token.split('.')[1];
		const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
		const json = atob(base64);
		const { exp } = JSON.parse(json) as { exp?: number };
		return typeof exp === 'number' ? exp * 1000 : null;
	} catch {
		return null;
	}
}

export function isAccessTokenValid(token: string | null): token is string {
	if (!token) return false;
	const expMs = decodeExpMs(token);
	if (expMs === null) return false;
	return Date.now() < expMs - EXPIRY_BUFFER_MS;
}

export class SessionExpiredError extends Error {
	constructor() {
		super('Session expired, please log in again.');
	}
}

type FetchFn = typeof fetch;

/** Calls the refresh endpoint once. Returns the new access token, or null on any failure. */
async function callRefreshEndpoint(fetchFn: FetchFn): Promise<string | null> {
	try {
		const res = await fetchFn(`${BASE}/auth/refresh`, {
			method: 'POST',
			credentials: 'include'
		});
		if (!res.ok) return null;
		const json = await res.json();
		return (json.data?.accessToken as string | undefined) ?? null;
	} catch {
		return null;
	}
}

/**
 * Returns a valid access token, refreshing it first if it's missing/expired.
 * On refresh failure, retries once more before giving up. If both attempts fail,
 * the in-memory token is cleared and a SessionExpiredError is thrown — callers
 * should catch this and send the user back to /login.
 */
export async function ensureAccessToken(fetchFn: FetchFn): Promise<string> {
	const current = getAccessToken();
	if (isAccessTokenValid(current)) return current;

	let newToken = await callRefreshEndpoint(fetchFn);
	if (!newToken) newToken = await callRefreshEndpoint(fetchFn); // 1 retry

	if (!newToken) {
		clearAccessToken();
		throw new SessionExpiredError();
	}

	setAccessToken(newToken);
	return newToken;
}
