<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';

	let studentId = $derived(authState.user?.id || '');
	let studentClasses = $derived(lmsStore.getClassesForStudent(studentId));

	let assignments = $derived(
		lmsStore.assignments.filter((a) => studentClasses.some((c) => c.id === a.classId))
	);
	let quizzes = $derived(
		lmsStore.quizzes.filter((q) => studentClasses.some((c) => c.id === q.classId))
	);

	let mySubmissions = $derived(
		lmsStore.assignmentSubmissions.filter(
			(s) => s.studentId === studentId && assignments.find((a) => a.id === s.assignmentId)
		)
	);
	let myQuizSubmissions = $derived(
		lmsStore.quizSubmissions.filter(
			(s) => s.studentId === studentId && quizzes.find((q) => q.id === s.quizId)
		)
	);

	function getSubmission(assignmentId: string) {
		return mySubmissions.find((s) => s.assignmentId === assignmentId);
	}

	function getQuizSubmission(quizId: string) {
		return myQuizSubmissions.find((s) => s.quizId === quizId);
	}

	function getClassName(classId: string) {
		return studentClasses.find((c) => c.id === classId)?.name || 'Unknown Class';
	}
</script>

<div class="flex justify-between items-center mb-6 mt-4">
	<h3 class="font-headline-md text-2xl font-bold flex items-center gap-2">
		<span class="material-symbols-outlined text-3xl">analytics</span>
		Rekap Nilai Anda (Keseluruhan)
	</h3>
</div>

<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6 md:p-8">
	<h3 class="font-headline-md text-xl font-bold mb-6 border-b-2 border-on-surface pb-3">Daftar Nilai Tugas</h3>
	<div class="flex flex-col gap-4">
		{#each assignments as assignment}
			{@const sub = getSubmission(assignment.id)}
			<div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container p-4 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] gap-4">
				<div>
					<span class="font-label-bold text-lg">{assignment.title}</span>
					<span class="block font-label-bold text-[10px] uppercase text-secondary mt-1">{getClassName(assignment.classId)}</span>
				</div>
				<div>
					{#if sub && sub.grade !== undefined}
						<div class="px-4 py-2 bg-primary-container neo-border font-label-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
							Nilai: <span class="text-xl">{sub.grade}</span>
						</div>
					{:else if sub}
						<div class="px-3 py-1 bg-white neo-border font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-secondary">
							Menunggu Penilaian
						</div>
					{:else}
						<div class="px-3 py-1 bg-error-container text-error neo-border font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
							Belum Mengumpulkan
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<p class="text-secondary italic">Tidak ada data tugas.</p>
		{/each}
	</div>
	
	<h3 class="font-headline-md text-xl font-bold mt-12 mb-6 border-b-2 border-on-surface pb-3">Daftar Nilai Kuis</h3>
	<div class="flex flex-col gap-4">
		{#each quizzes as quiz}
			{@const sub = getQuizSubmission(quiz.id)}
			<div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container p-4 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] gap-4">
				<div>
					<span class="font-label-bold text-lg">{quiz.title}</span>
					<span class="block font-label-bold text-[10px] uppercase text-secondary mt-1">{getClassName(quiz.classId)}</span>
				</div>
				<div>
					{#if sub}
						<div class="px-4 py-2 bg-primary-container neo-border font-label-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
							Skor: <span class="text-xl">{sub.score}</span>
						</div>
					{:else}
						<div class="px-3 py-1 bg-error-container text-error neo-border font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
							Belum Dikerjakan
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<p class="text-secondary italic">Tidak ada data kuis.</p>
		{/each}
	</div>
</article>
