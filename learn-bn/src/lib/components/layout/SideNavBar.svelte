<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Title from '$lib/components/Title.svelte';

	let {
		isMobileOpen = false,
		onClose = () => {},
	} = $props<{ isMobileOpen?: boolean; onClose?: () => void }>();

	let role = $derived(authState.user?.role || 'student');
	let user = $derived(authState.user);
	let userName = $derived(user?.name || 'User');
	let userInitial = $derived(userName.charAt(0).toUpperCase());

	let navItems = $derived(
		role === 'teacher'
			? [
					{ name: 'Dashboard', path: '/teacher', icon: 'dashboard' },
					{ name: 'Jadwal', path: '/teacher/schedule', icon: 'calendar_month' },
					{ name: 'Daftar Kelas', path: '/teacher/classes', icon: 'school' },
					{ name: 'Materi', path: '/teacher/materials', icon: 'menu_book' },
					{ name: 'Tugas', path: '/teacher/assignments', icon: 'assignment' },
					{ name: 'Kuis', path: '/teacher/quizzes', icon: 'quiz' },
					{ name: 'Rekap Nilai', path: '/teacher/grades', icon: 'grade' },
				]
			: [
					{ name: 'Dashboard', path: '/student', icon: 'dashboard' },
					{ name: 'Kelas Saya', path: '/student/classes', icon: 'school' },
					{ name: 'Jadwal', path: '/student/schedule', icon: 'calendar_month' },
					{ name: 'Materi Pelajaran', path: '/student/materials', icon: 'menu_book' },
					{ name: 'Tugas Anda', path: '/student/assignments', icon: 'assignment' },
					{ name: 'Kuis Anda', path: '/student/quizzes', icon: 'quiz' },
					{ name: 'Nilai Saya', path: '/student/grades', icon: 'analytics' },
				]
	);

	function isActive(path: string) {
		const dashboardPaths = ['/teacher', '/student'];
		if (dashboardPaths.includes(path)) {
			return $page.url.pathname === path;
		}
		return $page.url.pathname.startsWith(path);
	}

	async function handleLogout() {
		await authState.logout();
	}

	function handleNavClick() {
		if (isMobileOpen) {
			onClose();
		}
	}
</script>

<!-- Mobile Overlay -->
{#if isMobileOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-40 md:hidden"
		role="presentation"
		onclick={onClose}
	></div>
{/if}

<nav
	class="bg-surface flex flex-col fixed left-0 top-0 h-full p-stack-md w-64 border-r-2 border-on-surface shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] z-50 transition-transform duration-200
		{isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
		md:translate-x-0"
>
	<!-- Header: Logo + Portal Badge -->
	<div class="mb-stack-lg mt-2">
		<Title />
		<span class="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 text-xs font-label-bold uppercase tracking-wider border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#adff2f] text-on-surface">
			<span class="material-symbols-outlined text-xs" style="font-variation-settings: 'FILL' 1;">{role === 'teacher' ? 'school' : 'face'}</span>
			{role === 'teacher' ? 'Portal Guru' : 'Portal Murid'}
		</span>
	</div>

	<p class="text-secondary font-label-bold text-xs mb-3 uppercase tracking-wider px-1">
		{role === 'teacher' ? 'Menu Guru' : 'Menu Siswa'}
	</p>

	<!-- Nav Items -->
	<div class="flex flex-col gap-2 flex-1 overflow-y-auto">
		{#each navItems as item}
			<a
				href={item.path}
				onclick={handleNavClick}
				class="flex items-center gap-3 p-3 font-label-bold text-label-bold hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none {isActive(
					item.path
				)
					? 'bg-primary-container text-on-primary-container neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
					: 'text-on-surface hover:bg-surface-container'}"
			>
				<span
					class="material-symbols-outlined"
					style="font-variation-settings: 'FILL' {isActive(item.path) ? 1 : 0};"
					>{item.icon}</span
				>
				{item.name}
			</a>
		{/each}
	</div>

	<!-- Quick Add Button (Teacher only) -->
	{#if role === 'teacher'}
		<a href="/teacher/assignments/new" class="mb-4" onclick={handleNavClick}>
			<button
				class="bg-primary-container text-on-surface neo-border neo-shadow neo-shadow-hover neo-shadow-active font-label-bold text-label-bold py-3 px-4 w-full flex items-center justify-center gap-2 transition-all uppercase"
			>
				<span class="material-symbols-outlined">add</span>
				Tambah Tugas
			</button>
		</a>
	{/if}

	<!-- Profile Card + Logout at Bottom -->
	<div class="border-t-2 border-on-surface pt-4 mt-auto">
		<div class="flex items-center gap-3 mb-3 px-1">
			<div class="w-10 h-10 neo-border neo-shadow bg-primary-container overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-base">
				{userInitial}
			</div>
			<div class="min-w-0 flex-1">
				<p class="font-label-bold text-sm truncate">{userName}</p>
				<p class="font-label-bold text-[10px] text-secondary uppercase tracking-wider">
					{role === 'teacher' ? 'Guru' : 'Murid'}
				</p>
			</div>
		</div>
		<button
			class="w-full bg-error text-white neo-border neo-shadow neo-shadow-hover neo-shadow-active font-label-bold text-label-bold py-2.5 px-4 flex items-center justify-center gap-2 transition-all uppercase text-sm"
			onclick={handleLogout}
		>
			<span class="material-symbols-outlined text-sm">logout</span>
			Keluar
		</button>
	</div>
</nav>
