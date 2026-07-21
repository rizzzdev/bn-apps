<script lang="ts">
	import { page } from '$app/stores';
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';

	let classId = $derived($page.params.id as string);
	let studentId = $derived(authState.user?.id || '');

	let assignments = $derived(lmsStore.assignments.filter((a) => a.classId === classId));
	let mySubmissions = $derived(
		lmsStore.assignmentSubmissions.filter(
			(s) => s.studentId === studentId && assignments.find((a) => a.id === s.assignmentId)
		)
	);
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter mt-4">
	<!-- Main Feed Column -->
	<div class="lg:col-span-8 flex flex-col gap-stack-md">
		<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-8 text-center flex flex-col items-center justify-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4" style="font-variation-settings: 'FILL' 1;">waving_hand</span>
			<h3 class="font-headline-md text-2xl font-bold mb-2">Selamat Datang di Ikhtisar Kelas</h3>
			<p class="font-body-md text-secondary">Gunakan tab di atas untuk mengakses materi, tugas, kuis, dan nilai Anda.</p>
		</article>
	</div>

	<!-- Sidebar (Widgets) -->
	<aside class="lg:col-span-4 flex flex-col gap-stack-md">
		<!-- Progress Card -->
		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
			<h3 class="font-headline-md text-lg font-bold mb-4 border-b-2 border-on-surface pb-2 flex items-center gap-2">
				<span class="material-symbols-outlined">analytics</span>
				Progres Anda
			</h3>
			<div class="mb-2 flex justify-between font-label-bold text-sm">
				<span>Tugas Selesai</span>
				<span>
					{#if assignments.length > 0}
						{Math.round((mySubmissions.length / assignments.length) * 100)}%
					{:else}
						100%
					{/if}
				</span>
			</div>
			<div class="w-full neo-border-3 bg-white h-6 mb-4">
				<div class="bg-primary-container h-full border-r-2 border-on-surface transition-all duration-500" style="width: {assignments.length > 0 ? (mySubmissions.length / assignments.length) * 100 : 100}%"></div>
			</div>
			<p class="font-body-md text-sm text-secondary">Terus tingkatkan partisipasi Anda di kelas ini!</p>
		</div>
	</aside>
</div>
