<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';
	import ClassCard from '$lib/components/ClassCard.svelte';
</script>

<svelte:head>
	<title>Daftar Kelas - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex justify-between items-end mb-6">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">Daftar Kelas</h2>
		<p class="font-body-md text-secondary">Kelola kelas yang Anda ampu.</p>
	</div>
	<a href="/teacher/classes/new">
		<Button variant="primary">Buat Kelas Baru</Button>
	</a>
</div>

	{#await lmsStore.getTeacherClasses()}
		<div class="bg-surface-container p-6 neo-border text-center">
			<p class="font-bold text-secondary">Memuat kelas...</p>
		</div>
	{:then classes}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#if classes.length === 0}
				<div class="col-span-full bg-surface-container p-6 neo-border text-center">
					<p class="font-bold text-secondary">Belum ada kelas.</p>
				</div>
			{/if}
			{#each classes as cls}
				<ClassCard {cls} role="teacher" />
			{/each}
		</div>
	{:catch error}
		<div class="bg-surface-container p-6 neo-border text-center">
			<span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
			<p class="font-bold text-error">Gagal memuat kelas: {error.message}</p>
		</div>
	{/await}
</div>
