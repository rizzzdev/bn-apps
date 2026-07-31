<script lang="ts">
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import { authState } from '$lib/features/auth/auth.svelte';
	import ScheduleGrid from '$lib/components/ScheduleGrid.svelte';

	let schedulePromise = $derived(
		lmsStore.getStudentSchedule(authState.user?.profileId)
	);
</script>

<svelte:head>
	<title>Jadwal Pelajaran - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-stack-md">
	<div class="flex justify-between items-end mb-2">
		<div>
			<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">
				Jadwal Pelajaran
			</h2>
			<p class="font-body-md text-secondary">Jadwal pelajaran Anda pekan ini.</p>
		</div>
	</div>

	{#await schedulePromise}
		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-12 text-center flex flex-col items-center gap-4">
			<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
			<p class="font-label-bold text-secondary">Memuat jadwal...</p>
		</div>
	{:then schedule}
		<ScheduleGrid {schedule} type="student" />
	{:catch error}
		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-12 text-center flex flex-col items-center gap-4">
			<div class="w-16 h-16 bg-error-container neo-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
				<span class="material-symbols-outlined text-4xl text-error">error</span>
			</div>
			<h4 class="font-headline-md text-xl font-bold text-error">Gagal Memuat Jadwal</h4>
			<p class="font-body-md text-secondary">{error.message}</p>
		</div>
	{/await}
</div>
