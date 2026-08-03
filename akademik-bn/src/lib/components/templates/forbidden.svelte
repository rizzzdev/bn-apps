<script lang="ts">
	import { Icon, Button } from '$lib/components/atoms';
	import { clearAllCookies } from '$lib/utils/api';
	import { PUBLIC_API_URL, PUBLIC_PORTAL_URL } from '$env/static/public';
	import { toast } from '$lib/stores/toast.svelte';

	const rawApiUrl = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
	const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;
	const PORTAL_URL = (PUBLIC_PORTAL_URL || 'http://localhost:5173').replace(/\/+$/, '');
	const PORTAL_LOGIN_URL = `${PORTAL_URL}/login`;

	async function handleLogout() {
		try {
			await fetch(`${API_BASE}/auth/logout`, {
				method: 'POST',
				credentials: 'include'
			});
		} catch {
			// ignore
		}
		clearAllCookies();
		toast.success('Logged out');
		window.location.href = PORTAL_LOGIN_URL;
	}
</script>

<svelte:head>
	<title>403 - Akses Ditolak</title>
</svelte:head>

<div class="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
	<div
		class="max-w-sm w-full bg-surface border-2 border-on-background shadow-neo-sm p-5 flex flex-col items-center text-center gap-4"
	>
		<div
			class="w-16 h-16 bg-error border-2 border-on-background rounded-full shadow-neo-sm flex items-center justify-center -mt-10 mb-1"
		>
			<Icon name="block" class="text-lg text-surface" />
		</div>

		<div class="flex flex-col gap-2">
			<h1 class="font-headline font-black text-base uppercase tracking-tight text-on-background">
				403
			</h1>
			<h2
				class="font-headline font-bold text-sm uppercase tracking-tighter bg-error text-surface px-2 py-0.5 inline-block border border-on-background shadow-[1px_1px_0px_0px_#0f172a] transform -rotate-2"
			>
				Akses Ditolak!
			</h2>
			<p class="font-mono text-[10px] mt-3 text-on-background font-medium">
				Anda tidak memiliki izin untuk mengakses halaman ini. Silakan kembali ke portal yang sesuai
				dengan peran Anda.
			</p>
		</div>

		<div class="w-full flex flex-col gap-2 mt-3">
			<Button variant="secondary" class="w-full" href={PORTAL_URL}>
				<Icon name="dashboard" class="text-[10px]" />
				Kembali ke Portal
			</Button>
			<Button variant="danger" class="w-full" onclick={handleLogout}>
				<Icon name="logout" class="text-[10px]" />
				Keluar
			</Button>
		</div>
	</div>
</div>
