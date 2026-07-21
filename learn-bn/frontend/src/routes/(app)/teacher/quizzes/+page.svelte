<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';

	let teacherId = $derived(authState.user?.id || '');
	let teacherClasses = $derived(lmsStore.getClassesForTeacher(teacherId));
	let quizzes = $derived(
		lmsStore.quizzes.filter((q) => teacherClasses.some((c) => c.id === q.classId))
	);

	function getClassName(classId: string) {
		return teacherClasses.find((c) => c.id === classId)?.name || 'Unknown Class';
	}
</script>

<div class="flex justify-between items-center mb-6 mt-4">
	<h3 class="font-headline-md text-2xl font-bold flex items-center gap-2">
		<span class="material-symbols-outlined text-3xl">quiz</span>
		Daftar Kuis Keseluruhan
	</h3>
	<Button variant="primary" onclick={() => alert('Fitur tambah kuis menyusul (dummy)')}>Tambah Kuis</Button>
</div>

<div class="flex flex-col gap-6">
	{#if quizzes.length === 0}
		<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4">inbox</span>
			<p class="font-bold text-secondary text-lg">Belum ada kuis untuk kelas ini.</p>
		</div>
	{/if}
	{#each quizzes as quiz}
		<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:-translate-y-1 transition-transform duration-200">
			<div class="border-b-2 border-on-surface bg-[#E2E2E2] p-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-inverse-primary neo-border flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
						<span class="material-symbols-outlined text-on-surface">quiz</span>
					</div>
					<div>
						<h3 class="font-label-bold text-lg text-on-surface">{quiz.title}</h3>
						<p class="font-label-bold text-[10px] uppercase text-secondary mt-1 inline-block bg-white px-2 py-1 neo-border">
							{getClassName(quiz.classId)}
						</p>
					</div>
				</div>
			</div>
			<div class="p-6">
				<p class="font-body-md text-secondary">Kuis belum memiliki detail lebih lanjut di versi ini.</p>
			</div>
		</article>
	{/each}
</div>
