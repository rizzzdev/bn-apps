<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { page } from '$app/stores';
	import Title from '$lib/components/Title.svelte';

	let role = $derived(authState.user?.role || 'student');
	let navItems = $derived(
		role === 'teacher'
			? [
					{ name: 'Dashboard', path: '/teacher', icon: 'dashboard' },
					{ name: 'Daftar Kelas', path: '/teacher/classes', icon: 'school' },
					{ name: 'Materi', path: '/teacher/materials', icon: 'menu_book' },
					{ name: 'Tugas', path: '/teacher/assignments', icon: 'assignment' },
					{ name: 'Kuis', path: '/teacher/quizzes', icon: 'quiz' },
					{ name: 'Rekap Nilai', path: '/teacher/grades', icon: 'grade' }
				]
			: [
					{ name: 'Dashboard', path: '/student', icon: 'dashboard' },
					{ name: 'Kelas Saya', path: '/student/classes', icon: 'school' },
					{ name: 'Materi Pelajaran', path: '/student/materials', icon: 'menu_book' },
					{ name: 'Tugas Anda', path: '/student/assignments', icon: 'assignment' },
					{ name: 'Kuis Anda', path: '/student/quizzes', icon: 'quiz' },
					{ name: 'Nilai Saya', path: '/student/grades', icon: 'analytics' }
				]
	);

	function isActive(path: string) {
		return $page.url.pathname === path;
	}
</script>

<nav
	class="bg-surface hidden md:flex flex-col fixed left-0 top-0 h-full p-stack-md w-64 border-r-2 border-on-surface shadow-[4px_0px_0px_0px_rgba(0,0,0,1)] z-40"
>
	<div class="mb-stack-lg mt-2">
		<Title />
		<p class="text-secondary font-label-bold text-xs mt-4 uppercase tracking-wider">LMS Platform</p>
	</div>
	<div class="flex flex-col gap-2 flex-grow">
		{#each navItems as item}
			<a
				href={item.path}
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
	{#if role === 'teacher'}
		<a href="/teacher/classes/new" class="mt-auto">
			<button
				class="bg-primary-container text-on-surface neo-border neo-shadow neo-shadow-hover neo-shadow-active font-label-bold text-label-bold py-3 px-4 w-full flex items-center justify-center gap-2 transition-all uppercase"
			>
				<span class="material-symbols-outlined">add</span>
				Buat Konten
			</button>
		</a>
	{/if}
</nav>
