<script lang="ts">
	import { page } from '$app/stores';
	import AppLogo from '$lib/components/ui/AppLogo.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { resolveBackendUrl, getPortalLoginUrl } from '$lib/utils/backend-url';
	import { clearAccessToken } from '$lib/utils/access-token';
	import { env as publicEnv } from '$env/dynamic/public';

	let isLoggingOut = $state(false);

	const portalUrl = (
		(publicEnv as Record<string, string | undefined>).PUBLIC_PORTAL_URL || 'http://localhost:5173'
	).replace(/\/+$/, '');

	const allowedRolesStr =
		(publicEnv as Record<string, string | undefined>).PUBLIC_ALLOWED_ROLES ||
		'super_admin,teacher,student';
	const allowedRoles = allowedRolesStr
		.split(',')
		.map((r) => r.trim())
		.filter(Boolean);

	const userRoles = $derived<string[]>(
		Array.isArray($page.data.user?.roles) && $page.data.user.roles.length > 0
			? $page.data.user.roles
			: $page.data.user?.role
				? [$page.data.user.role]
				: []
	);

	const hasMatchingRole = $derived(userRoles.some((r) => allowedRoles.includes(r)));

	const myDashboardUrl = $derived.by(() => {
		if (userRoles.includes('super_admin')) return '/admin';
		if (userRoles.includes('teacher')) return '/supervisor';
		if (userRoles.includes('student')) return '/participant';
		return null;
	});

	function goToMyDashboard(e: MouseEvent) {
		e.preventDefault();
		if (myDashboardUrl) {
			window.location.replace(myDashboardUrl);
		}
	}

	function goToPortal(e: MouseEvent) {
		e.preventDefault();
		window.location.replace(portalUrl);
	}

	async function handleLogout() {
		isLoggingOut = true;
		try {
			await fetch(`${resolveBackendUrl()}/api/v1/auth/logout`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include'
			});
		} catch (e) {
			console.error('Logout error:', e);
		} finally {
			clearAccessToken();
			if (typeof document !== 'undefined') {
				document.cookie = 'access_token=; path=/; max-age=0';
				document.cookie = 'refresh_token=; path=/; max-age=0';
				document.cookie = 'user_data=; path=/; max-age=0';
			}
			window.location.href = getPortalLoginUrl();
		}
	}
</script>

<svelte:head>
	<title>403 Forbidden - Akses Ditolak</title>
</svelte:head>

<div
	class="flex min-h-svh w-full flex-col items-center justify-center bg-(--bg-primary) p-4 sm:p-6 lg:p-8"
>
	<!-- App Logo Header -->
	<div class="mb-6 flex items-center justify-center">
		<AppLogo size={36} textClass="text-xl" />
	</div>

	<!-- Main Card Panel (exam-bn native modal-panel design) -->
	<div
		class="modal-panel relative flex w-full max-w-lg flex-col items-center justify-center p-6 sm:p-8 text-center"
	>
		<!-- Badge -->
		<div class="mb-3">
			<Badge variant="danger" class="font-black uppercase tracking-wider text-xs px-3 py-1">
				Akses Ditolak
			</Badge>
		</div>

		<!-- Big 403 Code -->
		<div
			class="text-7xl sm:text-8xl font-black text-primary-500 tracking-tight mb-2 drop-shadow-[3px_3px_0_var(--nb-shadow)]"
		>
			403
		</div>

		<h1 class="text-xl sm:text-2xl font-black text-(--text-primary) mb-2">
			Area Terlarang!
		</h1>

		<p class="text-sm font-medium text-(--text-secondary) mb-6 max-w-md">
			Waduh, sepertinya Anda tersesat. Halaman ini diproteksi dan memerlukan peran khusus yang tidak
			dimiliki oleh akun Anda saat ini.
		</p>

		<!-- Action Buttons using exam-bn native button classes -->
		<div class="flex w-full flex-col gap-2.5 max-w-xs">
			{#if hasMatchingRole && myDashboardUrl}
				<a href={myDashboardUrl} onclick={goToMyDashboard} class="btn-primary w-full gap-2">
					<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
					Ke Dashboard Saya
				</a>
			{/if}

			<a href={portalUrl} onclick={goToPortal} class="btn-secondary w-full gap-2">


				<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
					/>
				</svg>
				Kembali ke Portal Utama
			</a>

			<button type="button" onclick={handleLogout} disabled={isLoggingOut} class="btn-danger w-full gap-2">
				<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
				{isLoggingOut ? 'Sedang keluar...' : 'Keluar'}
			</button>
		</div>
	</div>
</div>
