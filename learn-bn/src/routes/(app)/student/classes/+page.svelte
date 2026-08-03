<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';
	import ClassCard from '$lib/components/ClassCard.svelte';

	let studentId = $derived(authState.user?.profileId || '');
	let classesPromise = $derived(lmsStore.getStudentClasses(studentId));
</script>

<svelte:head>
	<title>Kelas Saya - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">Kelas Saya</h2>
		<p class="font-body-md text-secondary">Daftar kelas yang Anda ikuti.</p>
	</div>

	{#await classesPromise}
		<p class="text-secondary">Memuat...</p>
	{:then classes}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#if classes.length === 0}
				<div class="col-span-full bg-surface-container p-6 neo-border text-center">
					<p class="font-bold text-secondary">Belum ada kelas.</p>
				</div>
			{/if}
			{#each classes as cls}
				<ClassCard {cls} role="student" />
			{/each}
		</div>
	{:catch error}
		<p class="text-error">Gagal memuat data: {error.message}</p>
	{/await}
</div>
