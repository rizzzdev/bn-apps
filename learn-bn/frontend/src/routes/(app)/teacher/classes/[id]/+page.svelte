<script lang="ts">
	import { page } from '$app/stores';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';

	let classId = $derived($page.params.id as string);

	let materials = $derived(lmsStore.materials.filter((m) => m.classId === classId));
	let assignments = $derived(lmsStore.assignments.filter((a) => a.classId === classId));
	let quizzes = $derived(lmsStore.quizzes.filter((q) => q.classId === classId));
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
	<!-- Main Feed Column -->
	<div class="lg:col-span-8 flex flex-col gap-stack-md">
		<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-8 text-center flex flex-col items-center justify-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4" style="font-variation-settings: 'FILL' 1;">waving_hand</span>
			<h3 class="font-headline-md text-2xl font-bold mb-2">Selamat Datang di Ikhtisar Kelas</h3>
			<p class="font-body-md text-secondary">Gunakan tab di atas untuk mengelola materi, tugas, kuis, dan nilai kelas Anda.</p>
		</article>
	</div>

	<!-- Sidebar (Widgets) -->
	<aside class="lg:col-span-4 flex flex-col gap-stack-md">
		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
			<h3 class="font-headline-md text-lg font-bold mb-4 border-b-2 border-on-surface pb-2 flex items-center gap-2">
				<span class="material-symbols-outlined">analytics</span>
				Ringkasan Kelas
			</h3>
			<ul class="flex flex-col gap-3 font-label-bold text-sm">
				<li class="flex justify-between items-center bg-surface-container p-3 neo-border">
					<span>Total Materi</span>
					<span class="bg-primary-container px-2 py-1 neo-border text-lg">{materials.length}</span>
				</li>
				<li class="flex justify-between items-center bg-surface-container p-3 neo-border">
					<span>Total Tugas</span>
					<span class="bg-secondary text-white px-2 py-1 neo-border text-lg">{assignments.length}</span>
				</li>
				<li class="flex justify-between items-center bg-surface-container p-3 neo-border">
					<span>Total Kuis</span>
					<span class="bg-error text-white px-2 py-1 neo-border text-lg">{quizzes.length}</span>
				</li>
			</ul>
		</div>
	</aside>
</div>
