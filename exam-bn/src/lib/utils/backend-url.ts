import { PUBLIC_BACKEND_URL } from '$env/static/public';

/**
 * Resolves the backend origin to use for client-side requests.
 *
 * PUBLIC_BACKEND_URL is normally `http://localhost:3000`, which only works when the
 * frontend is opened on the same machine running the dev server. When the app is
 * accessed from another device via the host that `vite dev --host` shares (e.g. the
 * "Network" URL / a LAN IP), the browser would otherwise try to reach `localhost` on
 * *that device* instead of the dev machine — failing outright (and looking like a CORS
 * error since nothing responds). To fix that, if the configured backend host is a
 * loopback address, swap it for whatever hostname the page itself was loaded from,
 * keeping the configured port.
 */
export function resolveBackendUrl(): string {
	try {
		const configured = new URL(PUBLIC_BACKEND_URL);
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
		return PUBLIC_BACKEND_URL;
	}
}
