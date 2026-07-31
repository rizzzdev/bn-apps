<script lang="ts">
	import { page } from '$app/stores';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';

	let classId = $derived($page.params.id as string);

	let classesPromise = $derived(lmsStore.getTeacherClasses());
	let materialsPromise = $derived(lmsStore.getMaterialsByClass(classId));
	let assignmentsPromise = $derived(lmsStore.getAssignmentsByClass(classId));
	let quizzesPromise = $derived(lmsStore.getQuizzesByClass(classId));
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
	<div class="lg:col-span-8 flex flex-col gap-stack-md">
		{#await classesPromise}
			<div class="bg-surface-container-lowest neo-border p-8 text-center">
				<p class="font-bold text-secondary">Memuat data kelas...</p>
			</div>
		{:then classes}
			{@const classData = classes.find((c) => c.id === classId)}
			{#if classData}
				<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-8">
					<h3 class="font-headline-md text-2xl font-bold mb-2">{classData.name}</h3>
					<p class="font-body-md text-secondary mb-1">
						<span class="font-label-bold">Jurusan:</span> {classData.major?.name || '-'}
					</p>
					<p class="font-body-md text-secondary mb-1">
						<span class="font-label-bold">Mata Pelajaran:</span> {classData.subjectName || '-'}
					</p>
					<p class="font-body-md text-secondary">
						<span class="font-label-bold">Jumlah Siswa:</span> {classData.studentCount ?? 0}
					</p>
				</article>
			{/if}
		{:catch error}
			<div class="bg-surface-container-lowest neo-border p-8 text-center">
				<p class="font-bold text-error">Error: {error.message}</p>
			</div>
		{/await}

		{#await Promise.all([materialsPromise, assignmentsPromise, quizzesPromise])}
			<div class="bg-surface-container-lowest neo-border p-8 text-center">
				<p class="font-bold text-secondary">Memuat ringkasan...</p>
			</div>
		{:then [materials, assignments, quizzes]}
			<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-8 text-center flex flex-col items-center justify-center">
				<span class="material-symbols-outlined text-6xl text-secondary mb-4">waving_hand</span>
				<h3 class="font-headline-md text-2xl font-bold mb-2">Selamat Datang di Ikhtisar Kelas</h3>
				<p class="font-body-md text-secondary">Gunakan tab di atas untuk mengelola materi, tugas, kuis, dan nilai kelas Anda.</p>
			</article>
		{:catch error}
			<div class="bg-surface-container-lowest neo-border p-8 text-center">
				<p class="font-bold text-error">Error: {error.message}</p>
			</div>
		{/await}
	</div>

	<aside class="lg:col-span-4 flex flex-col gap-stack-md">
		{#await Promise.all([materialsPromise, assignmentsPromise, quizzesPromise])}
			<div class="bg-surface-container-lowest neo-border p-6">
				<p class="font-bold text-secondary">Memuat...</p>
			</div>
		{:then [materials, assignments, quizzes]}
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
		{:catch error}
			<div class="bg-surface-container-lowest neo-border p-6 text-center">
				<p class="font-bold text-error">Error: {error.message}</p>
			</div>
		{/await}
	</aside>
</div>
