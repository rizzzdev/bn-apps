<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import { PUBLIC_API_URL, PUBLIC_PORTAL_URL } from '$env/static/public';
	import { env as publicEnv } from '$env/dynamic/public';
	import { toast } from '$lib/stores/toast.svelte';
	import { page } from '$app/stores';
	import { formatTeacherName, getInitials } from '$lib/utils/image';
	import type { CurrentUser, TeacherProfile } from '$lib/types';

	const cookieDomain = (() => {
		const raw = (publicEnv as Record<string, string | undefined>).PUBLIC_COOKIE_DOMAIN || '';
		if (!raw) return '';
		return raw.trim().replace(/^\.+/, '');
	})();

	let { currentPath = '/', isMobileMenuOpen = $bindable(false) } = $props<{
		currentPath?: string;
		isMobileMenuOpen?: boolean;
	}>();

	const user = $derived(($page.data.user as CurrentUser | undefined) ?? null);
	const profile = $derived(($page.data.profile as TeacherProfile | undefined) ?? null);

	const displayName = $derived(profile?.fullname ? formatTeacherName(profile) : 'Admin Utama');
	const displayRole = $derived(
		profile
			? user?.roles?.includes('teacher')
				? 'Guru'
				: 'Administrator Sistem'
			: 'Administrator Sistem'
	);
	const initials = $derived(getInitials(displayName));

	const rawApiUrl = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
	const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;
	const rawPortalUrl = (PUBLIC_PORTAL_URL || 'http://localhost:5173').replace(/\/+$/, '');
	const PORTAL_LOGIN_URL = `${rawPortalUrl}/login`;

	async function handleLogout() {
		try {
			await fetch(`${API_BASE}/auth/logout`, {
				method: 'POST',
				credentials: 'include'
			});
		} catch {
			// ignore
		}
		document.cookie.split(';').forEach((c) => {
			document.cookie = c
				.replace(/^ +/, '')
				.replace(
					/=.*/,
					`=;expires=${new Date().toUTCString()};path=/;SameSite=Lax${cookieDomain ? `;domain=${cookieDomain}` : ''}`
				);
		});
		toast.success('Logged out');
		window.location.href = PORTAL_LOGIN_URL;
	}

	function closeMobile() {
		isMobileMenuOpen = false;
	}

	const navItems = [
		{ label: 'Dashboard', icon: 'dashboard', href: '/' },
		{ label: 'Jurusan Murid', icon: 'school', href: '/major-students' },
		{ label: 'Kelas Murid', icon: 'groups', href: '/class-students' },
		{ label: 'Guru Mapel', icon: 'menu_book', href: '/subject' },
		{ label: 'Jam Pelajaran', icon: 'schedule', href: '/lesson-hours' },
		{ label: 'Jadwal Pelajaran', icon: 'calendar_month', href: '/lesson-schedule' },
		{ label: 'Jadwal Piket', icon: 'calendar_today', href: '/schedule' }
	];

	function isActive(href: string) {
		if (href === '/') return currentPath === '/';
		return currentPath === href || currentPath.startsWith(href + '/');
	}
</script>

{#if isMobileMenuOpen}
	<button
		type="button"
		class="fixed inset-0 z-30 bg-black/50 sm:hidden border-none cursor-default"
		onclick={closeMobile}
		aria-label="Tutup menu navigasi"
	></button>
{/if}

<aside
	class="{isMobileMenuOpen
		? 'flex'
		: 'hidden'} md:flex fixed left-0 top-[var(--topnav-h)] h-[calc(100vh-var(--topnav-h))] flex-col z-40 bg-surface-container w-64 neo-border-r shadow-[6px_0px_0px_0px_#1C1B1B]"
>
	<nav class="flex-1 flex flex-col gap-2 px-3 pt-5 pb-5 overflow-y-auto">
		{#each navItems as item}
			<a
				href={item.href}
				onclick={closeMobile}
				class="flex items-center gap-3 px-2 py-1 font-label-caps text-label-caps uppercase transition-all neo-border border-4 {isActive(
					item.href
				)
					? 'bg-primary text-on-primary neo-border neo-shadow-sm font-bold active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
					: 'border-transparent text-on-surface-variant hover:bg-surface-container-highest hover:neo-border hover:shadow-[4px_4px_0px_0px_#1C1B1B]'}"
			>
				<Icon name={item.icon} size="20px" fill={isActive(item.href)} />
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="px-2 py-3 neo-border-t bg-surface-container-low flex flex-col gap-2">
		<div class="flex items-center gap-3 px-2 py-1">
			<div
				class="w-10 h-10 bg-primary neo-border neo-shadow-sm flex items-center justify-center flex-shrink-0"
			>
				<span class="font-headline font-black text-on-primary text-sm">{initials}</span>
			</div>
			<div class="flex-1 min-w-0">
				<p class="font-label-caps text-label-caps font-bold text-on-surface truncate">
					{displayName}
				</p>
				<p class="font-data-mono text-[10px] text-on-surface-variant truncate">
					{displayRole.toUpperCase()}
				</p>
			</div>
		</div>
		<button
			type="button"
			onclick={handleLogout}
			class="flex items-center justify-center gap-2 w-full px-2 py-1 font-label-caps text-label-caps uppercase bg-error text-on-error neo-border neo-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
		>
			<Icon name="logout" size="18px" /> Keluar
		</button>
	</div>
</aside>
