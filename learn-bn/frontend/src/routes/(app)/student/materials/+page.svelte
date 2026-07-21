<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';

	let studentId = $derived(authState.user?.id || '');
	let studentClasses = $derived(lmsStore.getClassesForStudent(studentId));
	let materials = $derived(
		lmsStore.materials.filter((m) => studentClasses.some((c) => c.id === m.classId))
	);

	function getClassName(classId: string) {
		return studentClasses.find((c) => c.id === classId)?.name || 'Unknown Class';
	}
</script>

<div class="flex justify-between items-center mb-6 mt-4">
	<h3 class="font-headline-md text-2xl font-bold flex items-center gap-2">
		<span class="material-symbols-outlined text-3xl">menu_book</span>
		Semua Materi Pelajaran
	</h3>
</div>

<div class="flex flex-col gap-6">
	{#if materials.length === 0}
		<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4">inbox</span>
			<p class="font-bold text-secondary text-lg">Belum ada materi untuk kelas ini.</p>
		</div>
	{/if}
	{#each materials as mat}
		<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:-translate-y-1 transition-transform duration-200">
			<div class="border-b-2 border-on-surface bg-surface-container p-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-white neo-border flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
						<span class="material-symbols-outlined text-on-surface">menu_book</span>
					</div>
					<div>
						<h3 class="font-label-bold text-lg text-on-surface">{mat.title}</h3>
						<p class="font-label-bold text-[10px] uppercase text-secondary mt-1 inline-block bg-white px-2 py-1 neo-border">
							{getClassName(mat.classId)}
						</p>
					</div>
				</div>
			</div>
			<div class="p-6">
				<p class="font-body-md text-on-surface mb-4 leading-relaxed">{mat.content}</p>
				{#if mat.attachmentName}
					<a class="flex items-center p-3 neo-border hover:bg-primary-container transition-colors group max-w-sm" href="#!">
						<div class="w-12 h-12 bg-error text-white neo-border flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
							<span class="font-label-bold text-xs uppercase">File</span>
						</div>
						<div class="ml-4 truncate">
							<p class="font-label-bold text-sm truncate">{mat.attachmentName}</p>
						</div>
					</a>
				{/if}
			</div>
		</article>
	{/each}
</div>
