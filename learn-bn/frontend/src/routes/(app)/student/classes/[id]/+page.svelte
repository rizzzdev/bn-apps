<script lang="ts">
	import { page } from '$app/stores';
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';

	let classId = $derived($page.params.id as string);
	let studentId = $derived(authState.user?.profileId || '');
	let assignmentsPromise = $derived(lmsStore.getAssignmentsByClass(classId));
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter mt-4">
	<div class="lg:col-span-8 flex flex-col gap-stack-md">
		<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-8 text-center flex flex-col items-center justify-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4" style="font-variation-settings: 'FILL' 1;">waving_hand</span>
			<h3 class="font-headline-md text-2xl font-bold mb-2">Selamat Datang di Ikhtisar Kelas</h3>
			<p class="font-body-md text-secondary">Gunakan tab di atas untuk mengakses materi, tugas, kuis, dan nilai Anda.</p>
		</article>
	</div>

	<aside class="lg:col-span-4 flex flex-col gap-stack-md">
		{#await assignmentsPromise}
			<div class="bg-surface-container-lowest neo-border p-6">
				<p class="text-secondary">Memuat progres...</p>
			</div>
		{:then assignments}
			<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
				<h3 class="font-headline-md text-lg font-bold mb-4 border-b-2 border-on-surface pb-2 flex items-center gap-2">
					<span class="material-symbols-outlined">analytics</span>
					Progres Anda
				</h3>
				<p class="font-body-md text-sm text-secondary">Total Tugas: {assignments.length}</p>
			</div>
		{:catch error}
			<div class="bg-surface-container-lowest neo-border p-6">
				<p class="text-error">Gagal memuat progres</p>
			</div>
		{/await}
	</aside>
</div>
