<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';

	let teacherClasses = $derived(lmsStore.getClassesForTeacher(authState.user?.id || ''));
	let totalSubmissions = $derived(
		lmsStore.assignmentSubmissions.filter((s) =>
			lmsStore.assignments.find(
				(a) => a.id === s.assignmentId && teacherClasses.find((c) => c.id === a.classId)
			)
		)
	);
	let pendingGrading = $derived(totalSubmissions.filter((s) => s.grade === undefined).length);
</script>

<div class="flex justify-between items-end mb-6">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">Dashboard Guru</h2>
		<p class="font-body-md text-secondary">Ringkasan aktivitas dan kelas Anda.</p>
	</div>
	<a href="/teacher/classes/new" class="hidden md:block">
		<Button variant="primary">Buat Kelas Baru</Button>
	</a>
</div>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
	<!-- Main Area (Classes) -->
	<div class="lg:col-span-8 flex flex-col gap-stack-md">
		<h3 class="font-headline-md text-xl font-bold border-b-2 border-on-surface pb-2">Daftar Kelas</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#if teacherClasses.length === 0}
				<div class="md:col-span-2 bg-surface-container-lowest p-12 neo-border text-center flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
					<div class="w-16 h-16 bg-primary-container neo-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 mb-6">
						<span class="material-symbols-outlined text-4xl">inventory_2</span>
					</div>
					<h4 class="font-headline-md text-xl font-bold mb-2">Belum Ada Kelas</h4>
					<p class="font-body-md text-secondary mb-6">Anda belum membuat kelas. Buat kelas pertama Anda sekarang.</p>
					<Button variant="primary">Buat Kelas Baru</Button>
				</div>
			{/if}
			{#each teacherClasses as cls}
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

	<!-- Sidebar (Widgets) -->
	<aside class="lg:col-span-4 flex flex-col gap-stack-md">
		<div class="bg-primary-container neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
			<h3 class="font-headline-md text-lg font-bold mb-2">Total Kelas</h3>
			<div class="text-display-lg font-black">{teacherClasses.length}</div>
		</div>

		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6 relative">
			<div class="absolute top-0 right-0 w-8 h-8 bg-error border-b-2 border-l-2 border-on-surface"></div>
			<h3 class="font-headline-md text-lg font-bold mb-4 flex items-center gap-2">
				<span class="material-symbols-outlined">assignment_late</span>
				Perlu Dinilai
			</h3>
			<div class="text-display-lg font-black text-error mb-4">{pendingGrading}</div>
			<p class="font-body-md text-sm text-secondary">Tugas murid menunggu penilaian Anda.</p>
		</div>

		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
			<h3 class="font-headline-md text-lg font-bold mb-2">Total Tugas Masuk</h3>
			<div class="text-display-lg font-black">{totalSubmissions.length}</div>
		</div>
	</aside>
</div>
