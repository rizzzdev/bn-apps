<script lang="ts">
	import { page } from '$app/stores';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import MemberCard from '$lib/components/MemberCard.svelte';
	import Card from '$lib/components/Card.svelte';

	let classId = $derived($page.params.id as string);
	let membersPromise = $derived(lmsStore.getClassStudents(classId));
</script>

<div class="mt-4">
	<h3 class="font-headline-md text-xl font-bold mb-6 flex items-center gap-2">
		<span class="material-symbols-outlined">group</span>
		Anggota Kelas
	</h3>

	{#await membersPromise}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each Array(6) as _}
				<Card class="animate-pulse">
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 rounded-full bg-surface-container neo-border"></div>
						<div class="space-y-2 flex-1">
							<div class="h-4 bg-surface-container neo-border w-3/4"></div>
							<div class="h-3 bg-surface-container neo-border w-1/2"></div>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{:then members}
		{#if members.length === 0}
			<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
				<span class="material-symbols-outlined text-6xl text-secondary mb-4">sentiment_dissatisfied</span>
				<p class="font-bold text-secondary text-lg">Belum ada anggota kelas.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each members as m}
					<MemberCard fullname={m.student.fullname} nis={m.student.nis} pictureUrl={m.student.pictureUrl} />
				{/each}
			</div>
		{/if}
	{:catch error}
		<div class="bg-error-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
			<p class="font-bold text-error text-lg">Gagal memuat anggota kelas.</p>
			<p class="text-error text-sm mt-2">{error.message}</p>
		</div>
	{/await}
</div>
