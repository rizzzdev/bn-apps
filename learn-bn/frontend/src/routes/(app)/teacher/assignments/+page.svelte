<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';

	let teacherId = $derived(authState.user?.id || '');
	let teacherClasses = $derived(lmsStore.getClassesForTeacher(teacherId));
	let assignments = $derived(
		lmsStore.assignments.filter((a) => teacherClasses.some((c) => c.id === a.classId))
	);
	let submissions = $derived(
		lmsStore.assignmentSubmissions.filter((s) => assignments.find((a) => a.id === s.assignmentId))
	);

	function getClassName(classId: string) {
		return teacherClasses.find((c) => c.id === classId)?.name || 'Unknown Class';
	}
</script>

<div class="flex justify-between items-center mb-6 mt-4">
	<h3 class="font-headline-md text-2xl font-bold flex items-center gap-2">
		<span class="material-symbols-outlined text-3xl">assignment</span>
		Daftar Tugas Keseluruhan
	</h3>
	<Button variant="secondary" onclick={() => alert('Fitur tambah tugas menyusul (dummy)')}>Tambah Tugas</Button>
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
				<p class="font-body-md text-on-surface mb-4 leading-relaxed line-clamp-3">{assignment.description}</p>
				<div class="flex items-center gap-2 mb-6 p-3 bg-surface-container w-max neo-border">
					<span class="material-symbols-outlined text-error">event</span>
					<span class="font-label-bold text-sm text-error">Batas Waktu: {new Date(assignment.dueDate).toLocaleString()}</span>
				</div>
				
				<div class="border-t-2 border-on-surface pt-6">
					<h5 class="font-headline-md font-bold mb-4 flex items-center gap-2">
						<span class="material-symbols-outlined">group</span>
						Pengumpulan Murid
					</h5>
					<div class="flex flex-col gap-3">
						{#each submissions.filter((s) => s.assignmentId === assignment.id) as sub}
							<div class="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container-lowest p-4 neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] gap-4">
								<div>
									<span class="font-label-bold text-base block">Murid ID: <span class="text-primary">{sub.studentId}</span></span>
									<span class="font-body-md text-sm text-secondary mt-1 block flex items-center gap-1">
										<span class="material-symbols-outlined text-sm">attachment</span> {sub.fileName}
									</span>
								</div>
								<div>
									{#if sub.grade !== undefined}
										<div class="px-4 py-2 bg-primary-container neo-border font-label-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
											Dinilai: <span class="text-lg">{sub.grade}</span>
										</div>
									{:else}
										<Button size="sm" variant="secondary" onclick={() => lmsStore.gradeAssignment(sub.id, 100, 'Bagus!')}>
											Beri Nilai 100
										</Button>
									{/if}
								</div>
							</div>
						{:else}
							<p class="text-sm text-secondary font-label-bold italic">Belum ada murid yang mengumpulkan.</p>
						{/each}
					</div>
				</div>
			</div>
		</article>
	{/each}
</div>
