<script lang="ts">
	import { lmsStore, type CurriculumClassesData } from '$lib/features/lms/lms-store.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let data = $state<CurriculumClassesData | null>(null);
	let loading = $state(true);
	let error = $state('');
	let page = $state(1);
	const limit = 20;

	async function loadData() {
		loading = true;
		error = '';
		try {
			data = await lmsStore.getCurriculumClasses(page, limit);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Gagal memuat data';
			error = msg;
		} finally {
			loading = false;
		}
	}

	$effect(() => { loadData(); });

	function onPageChange(p: number) { page = p; loadData(); }

	function formatDateIso(d: string | null): string {
		if (!d) return '-';
		return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	const totalPages = $derived(data ? Math.ceil(data.total / limit) : 0);

	function rateBadge(v: number) {
		if (v >= 80) return 'success';
		if (v >= 50) return 'warning';
		return 'error';
	}
</script>

<svelte:head>
	<title>Evaluasi Kelas - Akademik-BN</title>
</svelte:head>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<h2 class="text-display-lg-mobile font-black tracking-tight text-on-surface uppercase md:text-display-lg">
			Evaluasi Kelas
		</h2>
		<p class="font-body-md text-secondary">Pantau performa dan partisipasi per kelas.</p>
	</div>
</div>

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
					<th class="p-3">Kelas</th>
					<th class="hidden p-3 sm:table-cell">Siswa</th>
					<th class="hidden p-3 md:table-cell">Tugas</th>
					<th class="hidden p-3 md:table-cell">Materi</th>
					<th class="hidden p-3 md:table-cell">Kuis</th>
					<th class="hidden p-3 sm:table-cell">Rata Nilai</th>
					<th class="hidden p-3 lg:table-cell">Belum Dinilai</th>
					<th class="hidden p-3 lg:table-cell">Aktivitas</th>
				</tr>
			</thead>
			<tbody>
				{#each data.data as c}
					<tr class="border-b border-on-surface/20 transition-colors hover:bg-primary-container/10">
						<td class="p-3">
							<p class="font-label-bold text-xs">{c.className}</p>
						</td>
						<td class="hidden p-3 sm:table-cell"><Badge variant="neutral" size="xs">{c.studentCount}</Badge></td>
						<td class="hidden p-3 md:table-cell">
							<Badge variant={rateBadge(c.submissionRate)} size="xs">{c.submissionRate}%</Badge>
						</td>
						<td class="hidden p-3 md:table-cell">
							<Badge variant={rateBadge(c.materialReadRate)} size="xs">{c.materialReadRate}%</Badge>
						</td>
						<td class="hidden p-3 md:table-cell">
							<Badge variant={rateBadge(c.quizCompletionRate)} size="xs">{c.quizCompletionRate}%</Badge>
						</td>
						<td class="hidden p-3 sm:table-cell">
							{#if c.averageGrade !== null}
								<Badge variant={c.averageGrade < 75 ? 'error' : 'success'} size="xs">{c.averageGrade}</Badge>
							{:else}
								<span class="text-secondary">-</span>
							{/if}
						</td>
						<td class="hidden p-3 lg:table-cell">
							{#if c.ungradedCount > 0}
								<Badge variant="warning" size="xs">{c.ungradedCount}</Badge>
							{:else}
								<span class="text-success text-[10px]">0</span>
							{/if}
						</td>
						<td class="hidden p-3 lg:table-cell text-[10px] text-secondary">
							{formatDateIso(c.lastActivity)}
						</td>
					</tr>
				{/each}
				{#if data.data.length === 0}
					<tr><td colspan="8" class="p-6 text-center text-xs text-secondary">Tidak ada data kelas ditemukan.</td></tr>
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
		Total: {data.total} kelas
	</div>
{/if}
