<script lang="ts">
	import { page, navigating } from '$app/stores';
	import { type Snippet } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import AppLogo from '$lib/components/ui/AppLogo.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { onlineCount } from '$lib/stores/socket';
	import { resolveBackendUrl, getPortalLoginUrl } from '$lib/utils/backend-url';
	import { clearAccessToken } from '$lib/utils/access-token';
	import { getInitials, resolvePictureUrl } from '$lib/utils/avatar';
	import { env as publicEnv } from '$env/dynamic/public';

	let isLoggingOut = $state(false);
	let avatarImageError = $state(false);

	const portalUrl = (
		(publicEnv as Record<string, string | undefined>).PUBLIC_PORTAL_URL || 'http://localhost:5173'
	).replace(/\/+$/, '');

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

	let {
		children,
		menuItems,
		title,
		user,
		headerExtra
	}: {
		children: Snippet;
		menuItems: { name: string; path: string; icon: string; matchPrefix?: string }[];
		title: string;
		user?: { fullname?: string; role?: string; roles?: string[]; pictureUrl?: string | null };
		headerExtra?: Snippet;
	} = $props();

	let sidebarOpen = $state(false);

	function isActive(item: { path: string; matchPrefix?: string }): boolean {
		const p = $page.url.pathname;
		if (item.matchPrefix) return p === item.path || p.startsWith(item.matchPrefix);
		return p === item.path;
	}

	const roleLabel: Record<string, string> = {
		super_admin: 'Admin',
		teacher: 'Pengawas',
		student: 'Peserta'
	};

	const displayName = $derived(user?.fullname?.trim() || 'Super Admin');
	const initial = $derived(getInitials(displayName));
	const displayAvatarUrl = $derived(resolvePictureUrl(user?.pictureUrl));

	const userRoles = $derived(user?.roles || (user?.role ? [user.role] : ['student']));
	const currentPath = $derived($page.url.pathname);

	const roleSwitchItems = $derived.by(() => {
		const items: Array<{ name: string; path: string }> = [];
		const isSuperAdmin = userRoles.includes('super_admin');
		const isTeacher = userRoles.includes('teacher');
		const isStudent = userRoles.includes('student');

		if (isSuperAdmin && !currentPath.startsWith('/admin')) {
			items.push({ name: 'Mode Admin', path: '/admin' });
		}
		if (isTeacher && !currentPath.startsWith('/supervisor')) {
			items.push({ name: 'Mode Pengawas', path: '/supervisor' });
		}
		if (isStudent && !currentPath.startsWith('/participant')) {
			items.push({ name: 'Mode Peserta', path: '/participant' });
		}
		return items;
	});

	const profilePath = $derived(
		user?.role === 'super_admin'
			? '/admin/profile'
			: user?.role === 'teacher'
				? '/supervisor/profile'
				: '/participant/profile'
	);
</script>

<svelte:head>
	<title>{title} - Exam-BN</title>
</svelte:head>

<!-- Mobile sidebar backdrop -->
{#if sidebarOpen}
	<div
		class="fixed inset-0 bg-black/70 z-30 md:hidden"
		onclick={() => (sidebarOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (sidebarOpen = false)}
		role="button"
		tabindex="-1"
		aria-label="Tutup menu"
	></div>
{/if}

<div class="flex h-svh overflow-hidden bg-(--bg-primary)">
	<!-- Sidebar -->
	<aside
		class="app-sidebar fixed md:relative inset-y-0 left-0 z-40 w-64 shrink-0 flex flex-col
               bg-(--nb-card-bg) transition-transform duration-200 ease-in-out
               {sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}"
	>
		<!-- Logo -->
		<div class="app-sidebar-header h-16 flex items-center px-5 shrink-0">
			<div class="flex items-center gap-2.5">
				<AppLogo size={32} textClass="text-lg" />
			</div>
			<!-- Close button mobile -->
			<button
				class="btn-secondary ml-auto md:hidden p-2"
				onclick={() => (sidebarOpen = false)}
				aria-label="Tutup sidebar"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Nav -->
		<nav class="flex-1 overflow-y-auto py-3 px-3 space-y-1">
			{#each menuItems as item}
				{@const active = isActive(item)}
				<a
					href={item.path}
					onclick={() => (sidebarOpen = false)}
					class="flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all duration-100
                        {active
						? 'nav-item-active text-(--nb-card-bg)'
						: 'nav-item-inactive text-(--text-secondary) hover:text-(--text-primary) hover:-translate-x-0.5'}"
				>
					<svg class="shrink-0 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
					</svg>
					<span>{item.name}</span>
				</a>
			{/each}

			<a
				href={portalUrl}
				class="flex items-center gap-3 px-3 py-2.5 text-sm font-bold transition-all duration-100 nav-item-inactive text-(--text-secondary) hover:text-(--text-primary) hover:-translate-x-0.5"
			>
				<svg class="shrink-0 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
					/>
				</svg>
				<span>Kembali ke Portal Utama</span>
			</a>

			<!-- Role Switcher (if multi-role or super_admin) -->
			{#if roleSwitchItems.length > 0}
				<div class="pt-3 mt-3 border-t border-(--nb-border)/30">
					<p
						class="px-3 text-[10px] font-black uppercase tracking-wider text-(--text-secondary) mb-1.5"
					>
						Beralih Peran
					</p>
					{#each roleSwitchItems as switchItem}
						<a
							href={switchItem.path}
							onclick={() => (sidebarOpen = false)}
							class="flex items-center gap-3 px-3 py-2 text-xs font-bold text-(--text-secondary) hover:text-(--text-primary) transition-all"
						>
							<svg
								class="shrink-0 w-4 h-4 text-primary-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
								/>
							</svg>
							<span>{switchItem.name}</span>
						</a>
					{/each}
				</div>
			{/if}
		</nav>


		<!-- User + Logout -->
		<div class="app-sidebar-footer p-4 shrink-0 space-y-2">
			<a
				href={profilePath}
				onclick={() => (sidebarOpen = false)}
				class="btn-secondary w-full justify-start gap-3 px-2 py-2"
			>
				{#if displayAvatarUrl && !avatarImageError}
					<img
						src={displayAvatarUrl}
						alt={displayName}
						onerror={() => (avatarImageError = true)}
						class="w-8 h-8 rounded-full object-cover shrink-0 border border-(--nb-border)"
					/>
				{:else}
					<div
						class="avatar-pill w-8 h-8 flex items-center justify-center font-black text-xs shrink-0 text-white"
					>
						{initial}
					</div>
				{/if}
				<div class="min-w-0 flex-1 text-left">
					<p class="text-sm font-bold text-(--text-primary) truncate">{displayName}</p>
					<p class="text-xs text-(--text-secondary)">
						{roleLabel[user?.role ?? ''] ?? user?.role ?? '-'}
					</p>
					{#if $onlineCount > 0}
						<Badge variant="success" class="mt-1">{$onlineCount} online</Badge>
					{/if}
				</div>
			</a>
			<button
				type="button"
				onclick={handleLogout}
				disabled={isLoggingOut}
				class="btn-danger w-full justify-start gap-3 px-3 py-2 cursor-pointer"
			>
				<svg class="shrink-0 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
				{isLoggingOut ? 'Sedang keluar...' : 'Keluar'}
			</button>
		</div>
	</aside>

	<!-- Main area -->
	<div class="flex-1 flex flex-col min-w-0 overflow-hidden">
		<!-- Top header -->
		<header
			class="app-topbar h-16 shrink-0 bg-(--nb-card-bg) flex items-center px-4 sm:px-6 gap-4 z-20"
		>
			<!-- Hamburger (mobile only) -->
			<button
				class="btn-secondary md:hidden p-2"
				onclick={() => (sidebarOpen = true)}
				aria-label="Buka menu"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2.5"
						d="M4 6h16M4 12h16M4 18h16"
					/>
				</svg>
			</button>

			<!-- Page title -->
			<div class="flex-1 min-w-0">
				<p class="text-base font-black text-(--text-primary) truncate">
					{#each menuItems as item}
						{#if isActive(item)}{item.name}{/if}
					{/each}
				</p>
			</div>

			<!-- Theme toggle + Avatar -->
			<div class="shrink-0 flex items-center gap-2">
				{#if headerExtra}{@render headerExtra()}{/if}
				<ThemeToggle />
				<a href={profilePath} class="btn-secondary gap-2 px-2 py-1">
					<span class="hidden sm:block text-sm font-bold text-(--text-secondary)"
						>{displayName}</span
					>
					{#if displayAvatarUrl && !avatarImageError}
						<img
							src={displayAvatarUrl}
							alt={displayName}
							onerror={() => (avatarImageError = true)}
							class="w-7 h-7 rounded-full object-cover border border-(--nb-border)"
						/>
					{:else}
						<div
							class="avatar-pill w-7 h-7 flex items-center justify-center font-black text-xs text-white"
						>
							{initial}
						</div>
					{/if}
				</a>
			</div>
		</header>

		<!-- Navigation loading bar -->
		{#if $navigating}
			<div
				class="h-1 bg-(--bg-secondary) relative overflow-hidden shrink-0 border-b-2 border-(--nb-border)"
			>
				<div class="absolute inset-y-0 left-0 animate-loading-bar bg-primary-500"></div>
			</div>
		{/if}

		<!-- Page content -->
		<main class="flex-1 overflow-y-auto">
			<div class="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto relative">
				{#if $navigating}
					<div class="fixed inset-0 bg-(--bg-primary)/70 z-10 flex items-center justify-center">
						<div class="card flex flex-col items-center gap-3 px-6 py-4">
							<div
								class="h-8 w-8 border-4 border-(--bg-secondary) border-t-primary-500 animate-spin"
							></div>
							<span class="text-sm font-bold text-(--text-secondary)">Memuat...</span>
						</div>
					</div>
				{/if}
				{@render children()}
			</div>
		</main>
	</div>
</div>

