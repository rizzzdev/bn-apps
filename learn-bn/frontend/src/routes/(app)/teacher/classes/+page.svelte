<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';

	let classes = $derived(lmsStore.getClassesForTeacher(authState.user?.id || ''));
</script>

<div class="flex flex-col gap-6">
	<div class="flex justify-between items-end mb-4">
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">Daftar Kelas</h2>
		<a href="/teacher/classes/new">
			<Button variant="primary">Buat Kelas Baru</Button>
		</a>
	</div>
	
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#if classes.length === 0}
			<div class="col-span-full bg-surface-container p-6 neo-border text-center">
				<p class="font-bold text-secondary">Belum ada kelas.</p>
			</div>
		{/if}
		{#each classes as cls}
			<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex flex-col justify-between hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] transition-all duration-200">
				<div class="p-6">
					<div class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4">
						<span class="material-symbols-outlined text-on-surface">school</span>
					</div>
					<h4 class="font-headline-md text-lg font-bold">{cls.name}</h4>
					<div class="mt-2 inline-flex items-center px-2 py-1 bg-surface-container neo-border font-label-bold text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">ID: {cls.id}</div>
				</div>
				<div class="p-4 border-t-2 border-on-surface bg-[#E2E2E2]">
					<a href={`/teacher/classes/${cls.id}`}>
						<Button variant="primary" class="w-full">Kelola Kelas</Button>
					</a>
				</div>
			</article>
		{/each}
	</div>
</div>
