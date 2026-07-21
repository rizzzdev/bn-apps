<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';

	let studentId = $derived(authState.user?.id || '');
	let studentClasses = $derived(lmsStore.getClassesForStudent(studentId));

	let allAssignments = $derived(
		lmsStore.assignments.filter((a) => studentClasses.some((c) => c.id === a.classId))
	);
	let mySubmissions = $derived(
		lmsStore.assignmentSubmissions.filter((s) => s.studentId === studentId)
	);

	let pendingAssignments = $derived(
		allAssignments.filter((a) => !mySubmissions.find((s) => s.assignmentId === a.id))
	);
</script>

<div class="flex justify-between items-end mb-6">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">Dashboard Murid</h2>
		<p class="font-body-md text-secondary">Ringkasan kelas dan tugas Anda.</p>
	</div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
	<!-- Main Area (Classes) -->
	<div class="lg:col-span-8 flex flex-col gap-stack-md">
		<h3 class="font-headline-md text-xl font-bold border-b-2 border-on-surface pb-2">Kelas Saya</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#if studentClasses.length === 0}
				<div class="md:col-span-2 bg-surface-container-lowest p-12 neo-border text-center flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
					<div class="w-16 h-16 bg-primary-container neo-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 mb-6">
						<span class="material-symbols-outlined text-4xl">sentiment_dissatisfied</span>
					</div>
					<h4 class="font-headline-md text-xl font-bold mb-2">Belum Ada Kelas</h4>
					<p class="font-body-md text-secondary">Anda belum terdaftar di kelas mana pun.</p>
				</div>
			{/if}
			{#each studentClasses as cls}
				<article class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] flex flex-col justify-between hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] transition-all duration-200">
					<div class="p-6">
						<div class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4">
							<span class="material-symbols-outlined text-on-surface">school</span>
						</div>
						<h4 class="font-headline-md text-lg font-bold">{cls.name}</h4>
						<div class="mt-2 inline-flex items-center px-2 py-1 bg-surface-container neo-border font-label-bold text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase">ID: {cls.id}</div>
					</div>
					<div class="p-4 border-t-2 border-on-surface bg-[#E2E2E2]">
						<a href={`/student/classes/${cls.id}`}>
							<Button variant="secondary" class="w-full">Buka Kelas</Button>
						</a>
					</div>
				</article>
			{/each}
		</div>
	</div>

	<!-- Sidebar (Widgets) -->
	<aside class="lg:col-span-4 flex flex-col gap-stack-md">
		<div class="bg-primary-container neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
			<h3 class="font-headline-md text-lg font-bold mb-2">Total Kelas Diikuti</h3>
			<div class="text-display-lg font-black">{studentClasses.length}</div>
		</div>

		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6 relative">
			<div class="absolute top-0 right-0 w-8 h-8 bg-error border-b-2 border-l-2 border-on-surface"></div>
			<h3 class="font-headline-md text-lg font-bold mb-4 flex items-center gap-2">
				<span class="material-symbols-outlined">assignment_late</span>
				Tugas Belum Dikerjakan
			</h3>
			<div class="text-display-lg font-black text-error mb-4">{pendingAssignments.length}</div>
			<p class="font-body-md text-sm text-secondary">Segera kerjakan tugas Anda sebelum tenggat waktu berakhir!</p>
		</div>
	</aside>
</div>
