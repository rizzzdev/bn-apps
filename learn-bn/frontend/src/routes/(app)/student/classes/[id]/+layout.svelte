<script lang="ts">
	import { page } from '$app/stores';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';

	let { children } = $props();

	let classId = $derived($page.params.id as string);
	let classData = $derived(lmsStore.classes.find((c) => c.id === classId));
	
	let currentPath = $derived($page.url.pathname);

	function isActive(tabPath: string) {
		return currentPath === tabPath;
	}
</script>

{#if !classData}
	<div class="flex flex-col items-center justify-center p-12 bg-surface-container-lowest neo-border shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] text-center max-w-lg mx-auto mt-12">
		<span class="material-symbols-outlined text-6xl text-error mb-4" style="font-variation-settings: 'FILL' 1;">error</span>
		<h2 class="font-headline-md text-2xl font-black mb-2 text-on-surface">Kelas Tidak Ditemukan</h2>
		<p class="font-body-md text-secondary">Kelas yang Anda cari tidak ada atau Anda tidak memiliki akses.</p>
	</div>
{:else}
	<div class="flex justify-between items-end mb-8 mt-2 pb-4 border-b-2 border-on-surface">
		<div>
			<h2 class="font-display-lg text-4xl font-black tracking-tight">{classData.name}</h2>
			<div class="mt-3 inline-flex items-center px-3 py-1 bg-surface-container neo-border font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">ID: {classData.id}</div>
		</div>
	</div>

	{@render children()}
{/if}
