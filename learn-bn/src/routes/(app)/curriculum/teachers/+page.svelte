<script lang="ts">
	import { lmsStore, type CurriculumTeachersData, type CurriculumTeacher } from '$lib/features/lms/lms-store.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import Input from '$lib/components/Input.svelte';

	let data = $state<CurriculumTeachersData | null>(null);
	let loading = $state(true);
	let error = $state('');
	let page = $state(1);
	let search = $state('');
	const limit = 15;

	async function loadData() {
		loading = true;
		error = '';
		try {
			data = await lmsStore.getCurriculumTeachers(page, limit, search || undefined);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Gagal memuat data';
			error = msg;
		} finally {
			loading = false;
		}
	}

	$effect(() => { loadData(); });

	function onSearch() { page = 1; loadData(); }
	function onPageChange(p: number) { page = p; loadData(); }

	function formatDateIso(d: string | null): string {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	const totalPages = $derived(data ? Math.ceil(data.total / limit) : 0);
</script>

<svelte:head>
	<title>Monitoring Guru - Akademik-BN</title>
</svelte:head>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<h2 class="text-display-lg-mobile font-black tracking-tight text-on-surface uppercase md:text-display-lg">
			Monitoring Guru
		</h2>
		<p class="font-body-md text-secondary">Pantau produktivitas dan aktivitas mengajar seluruh guru.</p>
	</div>
</div>

<!-- Search -->
<form class="mb-4 max-w-md" onsubmit={(e) => { e.preventDefault(); onSearch(); }}>
	<Input
		type="text"
		placeholder="Cari guru berdasarkan nama, email, atau NIP..."
		bind:value={search}
		icon="search"
	/>
</form>

{#if loading}
	<div class="space-y-3">
		{#each Array(8) as _ (Math.random())}
			<div class="h-14 animate-pulse bg-surface-container neo-border"></div>
		{/each}
	</div>
{:else if error}
	<div class="flex flex-col items-center bg-surface-container-lowest p-10 text-center shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] neo-border">
		<span class="material-symbols-outlined mb-3 text-4xl text-error">error</span>
		<p class="font-label-bold text-sm text-error">{error}</p>
	</div>
{:else if data}
	<div class="overflow-x-auto bg-surface-container-lowest shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] neo-border">
		<table class="w-full text-left text-xs">
			<thead>
				<tr class="border-b-2 border-on-surface font-label-bold text-[10px] text-secondary uppercase tracking-wider">
					<th class="p-3">Guru</th>
					<th class="hidden p-3 sm:table-cell">Kelas</th>
					<th class="hidden p-3 md:table-cell">Materi</th>
					<th class="hidden p-3 md:table-cell">Tugas</th>
					<th class="hidden p-3 md:table-cell">Kuis</th>
					<th class="hidden p-3 sm:table-cell">Status Penilaian</th>
					<th class="hidden p-3 lg:table-cell">Aktivitas Terakhir</th>
					<th class="p-3">Detail</th>
				</tr>
			</thead>
			<tbody>
				{#each data.data as t}
					<tr class="border-b border-on-surface/20 transition-colors hover:bg-primary-container/10">
						<td class="p-3">
							<p class="font-label-bold text-xs">{t.fullname}</p>
							{#if t.email}<p class="font-label-bold text-[9px] text-secondary">{t.email}</p>{/if}
						</td>
						<td class="hidden p-3 sm:table-cell"><Badge variant="neutral" size="xs">{t.classCount}</Badge></td>
						<td class="hidden p-3 md:table-cell">{t.materialsPublished}</td>
						<td class="hidden p-3 md:table-cell">{t.assignmentsPublished}</td>
						<td class="hidden p-3 md:table-cell">{t.quizzesPublished}</td>
						<td class="hidden p-3 sm:table-cell">
							{#if t.totalSubmissions > 0}
								<div class="flex items-center gap-1.5">
									<Badge variant={t.gradedRate >= 80 ? 'success' : t.gradedRate >= 50 ? 'warning' : 'error'} size="xs">
										{t.gradedCount}/{t.totalSubmissions}
									</Badge>
									<span class="font-label-bold text-[9px] text-secondary">{t.gradedRate}%</span>
								</div>
							{:else}
								<span class="text-secondary">-</span>
							{/if}
						</td>
						<td class="hidden p-3 lg:table-cell text-[10px] text-secondary">{formatDateIso(t.lastActivity)}</td>
						<td class="p-3">
							<a href="/curriculum/teachers" class="font-label-bold text-[10px] text-primary hover:underline">Lihat</a>
						</td>
					</tr>
				{/each}
				{#if data.data.length === 0}
					<tr><td colspan="8" class="p-6 text-center text-xs text-secondary">Tidak ada data guru ditemukan.</td></tr>
				{/if}
			</tbody>
		</table>
	</div>

	{#if totalPages > 1}
		<div class="mt-4 flex justify-center">
			<Pagination currentPage={page} {totalPages} totalItems={data?.total ?? 0} itemsPerPage={limit} onPageChange={onPageChange} />
		</div>
	{/if}

	<div class="mt-2 text-right font-label-bold text-[9px] text-secondary">
		Total: {data.total} guru
	</div>
{/if}
