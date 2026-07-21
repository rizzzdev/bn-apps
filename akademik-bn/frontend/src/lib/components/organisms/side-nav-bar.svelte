<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import { goto } from '$app/navigation';
	import { PUBLIC_MASTER_API_URL } from '$env/static/public';
	import { toast } from '$lib/stores/toast.svelte';

	let { currentPath = '/', isMobileMenuOpen = $bindable(false) } = $props<{
		currentPath?: string;
		isMobileMenuOpen?: boolean;
	}>();

	async function handleLogout() {
		await fetch(`${PUBLIC_MASTER_API_URL}/auth/logout`, {
			method: 'POST',
			credentials: 'include'
		});
		document.cookie.split(';').forEach((c) => {
			document.cookie = c
				.replace(/^ +/, '')
				.replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
		});
		toast.success('Logged out');
		goto('/login');
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
				class="flex items-center gap-3 px-4 py-3 font-label-caps text-label-caps uppercase transition-all neo-border border-4 {isActive(
					item.href
				)
					? 'bg-secondary-container text-on-secondary-container neo-border neo-shadow-sm font-bold active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'
					: 'border-transparent text-on-surface-variant hover:bg-surface-container-highest hover:neo-border hover:shadow-[4px_4px_0px_0px_#1C1B1B]'}"
			>
				<Icon name={item.icon} size="22px" fill={isActive(item.href)} />
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="px-3 py-4 neo-border-t bg-surface-container-low flex flex-col gap-2">
		<div class="flex items-center gap-3 px-4 py-3">
			<div
				class="w-10 h-10 bg-primary neo-border neo-shadow-sm flex items-center justify-center flex-shrink-0"
			>
				<Icon name="person" class="text-on-primary" size="22px" fill />
			</div>
			<div class="flex-1 min-w-0">
				<p class="font-label-caps text-label-caps font-bold text-on-surface truncate">
					Admin Utama
				</p>
				<p class="font-data-mono text-data-mono text-[10px] text-on-surface-variant truncate">
					ADMINISTRATOR SISTEM
				</p>
			</div>
		</div>
		<button
			type="button"
			onclick={handleLogout}
			class="flex items-center justify-center gap-2 w-full px-4 py-3 font-label-caps text-label-caps uppercase bg-error text-on-error neo-border neo-shadow-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
		>
			<Icon name="logout" size="18px" /> Keluar
		</button>
	</div>
</aside>
