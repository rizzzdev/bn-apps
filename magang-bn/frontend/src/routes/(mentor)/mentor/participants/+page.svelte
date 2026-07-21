<script lang="ts">
	import { Pagination } from '$lib/components/molecules';
	import { Icon, Button, ActionButton } from '$lib/components/atoms';
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/utils/api';
	import { page } from '$app/stores';

	let currentPage = $state(1);
	let totalPages = $state(1);
	let participants = $state<any[]>([]);
	let loading = $state(true);

	let mentorId = $derived($page.data.profileData?.mentorId || '');

	async function fetchParticipants(pageNo = 1) {
		loading = true;
		if (mentorId) {
			const res = await apiClient(`/api/v1/internship-placements?mentorId=${mentorId}&page=${pageNo}&limit=10`);
			if (res && !res.error) {
				participants = res.data || [];
				totalPages = res.pagination?.totalPage || 1;
				currentPage = res.pagination?.currentPage || 1;
			}
		}
		loading = false;
	}

	onMount(() => {
		if (mentorId) fetchParticipants(currentPage);
	});

	$effect(() => {
		if (mentorId) fetchParticipants(currentPage);
	});
</script>

<svelte:head>
	<title>Peserta Magang | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up">
	<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Daftar Peserta Magang</h2>
	<p class="font-mono text-secondary mt-1">Daftar murid yang saat ini sedang melaksanakan magang di instansi Anda.</p>
</div>

<div class="border-4 border-on-background bg-surface overflow-x-auto shadow-neo animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<table class="w-full text-left border-collapse min-w-[800px]">
		<thead>
			<tr class="border-b-4 border-on-background bg-slate-100 font-headline font-black uppercase text-sm">
				<th class="p-4 border-r-4 border-on-background">Nama Lengkap</th>
				<th class="p-4 border-r-4 border-on-background">Asal Sekolah</th>
				<th class="p-4 border-r-4 border-on-background text-center">Waktu Mulai</th>
				<th class="p-4 border-r-4 border-on-background text-center">Status</th>
				<th class="p-4 text-center">Aksi</th>
			</tr>
		</thead>
		<tbody>
			{#if loading}
				<tr>
					<td colspan="5" class="p-8 text-center">
						<Icon name="sync" class="text-4xl animate-spin text-primary" />
					</td>
				</tr>
			{:else if participants.length === 0}
				<tr>
					<td colspan="5" class="p-8 text-center font-mono text-secondary">Belum ada peserta magang</td>
				</tr>
			{:else}
				{#each participants as p}
					<tr class="border-b-4 border-on-background hover:bg-blue-50 transition-colors">
						<td class="p-4 border-r-4 border-on-background font-bold">{p.student?.name || '-'}</td>
						<td class="p-4 border-r-4 border-on-background font-mono text-sm">Sekolah</td>
						<td class="p-4 border-r-4 border-on-background text-center font-mono text-sm">
							{new Date(p.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
						</td>
						<td class="p-4 border-r-4 border-on-background text-center">
							<span class="inline-block px-3 py-1 {p.status === 'active' ? 'bg-success' : p.status === 'completed' ? 'bg-primary' : 'bg-warning'} text-on-background border-2 border-on-background font-bold text-xs uppercase">{p.status}</span>
						</td>
						<td class="p-4 text-center">
							<ActionButton variant="secondary" icon="visibility" label="Lihat Detail Peserta" />
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

{#if !loading && totalPages > 1}
	<div class="mt-6 flex justify-end animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}
