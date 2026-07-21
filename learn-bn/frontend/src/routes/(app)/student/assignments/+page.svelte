<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';

	let studentId = $derived(authState.user?.id || '');
	let studentClasses = $derived(lmsStore.getClassesForStudent(studentId));

	let assignments = $derived(
		lmsStore.assignments.filter((a) => studentClasses.some((c) => c.id === a.classId))
	);
	let mySubmissions = $derived(
		lmsStore.assignmentSubmissions.filter(
			(s) => s.studentId === studentId && assignments.find((a) => a.id === s.assignmentId)
		)
	);

	function getSubmission(assignmentId: string) {
		return mySubmissions.find((s) => s.assignmentId === assignmentId);
	}

	function getClassName(classId: string) {
		return studentClasses.find((c) => c.id === classId)?.name || 'Unknown Class';
	}
</script>

<div class="flex justify-between items-center mb-6 mt-4">
	<h3 class="font-headline-md text-2xl font-bold flex items-center gap-2">
		<span class="material-symbols-outlined text-3xl">assignment</span>
		Semua Tugas Anda
	</h3>
</div>

<div class="flex flex-col gap-6">
	{#if assignments.length === 0}
		<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4">inbox</span>
			<p class="font-bold text-secondary text-lg">Belum ada tugas untuk kelas ini.</p>
		</div>
	{/if}
	{#each assignments as assignment}
		<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:-translate-y-1 transition-transform duration-200">
			<div class="border-b-2 border-on-surface bg-[#E2E2E2] p-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-primary-container neo-border flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
						<span class="material-symbols-outlined text-on-surface">assignment</span>
					</div>
					<div>
						<h3 class="font-label-bold text-lg text-on-surface">{assignment.title}</h3>
						<p class="font-label-bold text-[10px] uppercase text-secondary mt-1 inline-block bg-white px-2 py-1 neo-border">
							{getClassName(assignment.classId)}
						</p>
					</div>
				</div>
			</div>
			<div class="p-6">
				<p class="font-body-md mb-4 text-on-surface line-clamp-2 leading-relaxed">{assignment.description}</p>
				<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 p-4 border-2 border-on-surface bg-background border-dashed gap-4">
					<div class="flex items-center gap-2">
						<span class="material-symbols-outlined text-error">event</span>
						<span class="font-label-bold text-sm text-error">Tenggat: {new Date(assignment.dueDate).toLocaleString()}</span>
					</div>
					
					{#if getSubmission(assignment.id)}
						<div class="flex items-center gap-4">
							<div class="px-3 py-1 bg-primary-container neo-border font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
								Selesai
							</div>
							<a href={`/student/assignments/${assignment.id}`}>
								<Button variant="outline" size="sm">Lihat Detail</Button>
							</a>
						</div>
					{:else}
						<div class="flex items-center gap-4">
							<div class="px-3 py-1 bg-white neo-border font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-error">
								Belum Selesai
							</div>
							<a href={`/student/assignments/${assignment.id}`}>
								<Button variant="primary" size="sm">Kerjakan</Button>
							</a>
						</div>
					{/if}
				</div>
			</div>
		</article>
	{/each}
</div>
