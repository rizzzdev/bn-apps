/**
 * Whether auth cookies should be marked `Secure` for this request.
 *
 * SvelteKit's own default only skips `Secure` when the hostname is exactly
 * `localhost`. That breaks login when the app is opened over plain HTTP from
 * any other host — including a LAN IP (e.g. `http://192.168.1.75:5173`) — because
 * browsers silently refuse to store a `Secure` cookie sent without HTTPS, so the
 * session never actually persists even though the login request itself succeeds.
 *
 * Mirror the cookie to the real transport instead: secure only when the request
 * actually came in over HTTPS, regardless of hostname.
 */
export function isSecureRequest(url: URL): boolean {
	return url.protocol === 'https:';
}
