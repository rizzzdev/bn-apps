<script lang="ts">
	import { page } from '$app/stores';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';

	let { children } = $props();

	let classId = $derived($page.params.id as string);
	let currentPath = $derived($page.url.pathname);

	let tabs = $derived([
		{ label: 'Overview', path: `/teacher/classes/${classId}`, icon: 'overview' },
		{ label: 'Materi', path: `/teacher/classes/${classId}/materials`, icon: 'menu_book' },
		{ label: 'Tugas', path: `/teacher/classes/${classId}/assignments`, icon: 'assignment' },
		{ label: 'Kuis', path: `/teacher/classes/${classId}/quizzes`, icon: 'quiz' },
		{ label: 'Anggota', path: `/teacher/classes/${classId}/members`, icon: 'group' },
	]);

	function isActive(tabPath: string) {
		return currentPath === tabPath;
	}
</script>

{#await lmsStore.getTeacherClasses()}
	<div class="flex flex-col items-center justify-center p-12 bg-surface-container-lowest neo-border text-center max-w-lg mx-auto mt-12">
		<span class="material-symbols-outlined text-4xl text-secondary mb-2">hourglass</span>
		<p class="font-bold text-secondary">Memuat data kelas...</p>
	</div>
{:then classes}
	{@const classData = classes.find((c) => c.id === classId)}
	{#if !classData}
		<div class="flex flex-col items-center justify-center p-12 bg-surface-container-lowest neo-border text-center max-w-lg mx-auto mt-12">
			<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
			<h2 class="font-headline-md text-2xl font-black mb-2 text-on-surface">Kelas Tidak Ditemukan</h2>
			<p class="font-body-md text-secondary">Kelas yang Anda cari tidak ada atau Anda tidak memiliki akses.</p>
		</div>
	{:else}
		<div class="flex justify-between items-end mb-6 mt-2 pb-4 border-b-2 border-on-surface">
			<div>
				<h2 class="font-display-lg text-4xl font-black tracking-tight">{classData.name}</h2>
				<div class="mt-3 flex items-center gap-2">
					<span class="inline-flex items-center px-3 py-1 bg-surface-container neo-border font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">{classData.major?.name || '-'}</span>
					<span class="inline-flex items-center px-3 py-1 bg-surface-container neo-border font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">{classData.subjectName || '-'}</span>
				</div>
			</div>
		</div>

		<nav class="flex flex-wrap gap-2 mb-8">
			{#each tabs as tab}
				<a
					href={tab.path}
					class="inline-flex items-center gap-2 px-4 py-2 font-label-bold text-sm uppercase transition-all duration-100 {isActive(tab.path)
						? 'bg-primary-container neo-border neo-shadow'
						: 'bg-surface-container-lowest border-2 border-on-surface hover:bg-surface-container'}"
				>
					<span class="material-symbols-outlined text-sm">{tab.icon}</span>
					{tab.label}
				</a>
			{/each}
		</nav>

		{@render children()}
	{/if}
{:catch error}
	<div class="flex flex-col items-center justify-center p-12 bg-surface-container-lowest neo-border text-center max-w-lg mx-auto mt-12">
		<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
		<h2 class="font-headline-md text-2xl font-black mb-2 text-on-surface">Gagal Memuat</h2>
		<p class="font-body-md text-secondary">{error.message}</p>
	</div>
{/await}
