import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// This app is exposed directly on the LAN (no reverse proxy/TLS in front), and
			// is accessed via whatever host each user's device resolves — `localhost`, the
			// server's LAN IP, etc. SvelteKit's CSRF guard rejects a form POST whenever the
			// browser's `Origin` header doesn't exactly match the server's configured/
			// detected origin, which breaks for every host except the one ORIGIN happens to
			// be set to. Since there's no untrusted cross-origin traffic to defend against
			// here, trust all origins rather than pin the app to a single access URL.
			csrf: { trustedOrigins: ['*'] }
		})
	],
	server: {
		// Bind on all interfaces (same effect as `vite dev --host`) so the dev server
		// is reachable from other devices on the network, not just localhost.
		host: true,
		// Vite blocks requests whose Host header isn't localhost/the bound IP unless
		// explicitly allowed — this is what breaks access via a shared LAN URL or a
		// dev tunnel. Disable that check in dev.
		allowedHosts: true
	}
});
