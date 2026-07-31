<script lang="ts">
	import { page } from '$app/stores';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import MemberCard from '$lib/components/MemberCard.svelte';

	let classId = $derived($page.params.id as string);
</script>

<div class="flex flex-col gap-6">
	<h3 class="font-headline-md text-xl font-bold flex items-center gap-2">
		<span class="material-symbols-outlined text-2xl">group</span>
		Anggota Kelas
	</h3>

	{#await lmsStore.getClassStudents(classId)}
		<div class="bg-surface-container p-6 neo-border text-center">
			<p class="font-bold text-secondary">Memuat anggota kelas...</p>
		</div>
	{:then members}
		{#if members.length === 0}
			<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
				<span class="material-symbols-outlined text-6xl text-secondary mb-4">person_off</span>
				<p class="font-bold text-secondary text-lg">Belum ada anggota.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each members as member}
					<MemberCard
						fullname={member.student.fullname}
						nis={member.student.nis}
						pictureUrl={member.student.pictureUrl}
					/>
				{/each}
			</div>
		{/if}
	{:catch error}
		<div class="bg-surface-container p-6 neo-border text-center">
			<span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
			<p class="font-bold text-error">Gagal memuat anggota: {error.message}</p>
		</div>
	{/await}
</div>
