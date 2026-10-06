<script lang="ts">
	import { lmsStore, type CurriculumStudentsAtRiskData } from '$lib/features/lms/lms-store.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let data = $state<CurriculumStudentsAtRiskData | null>(null);
	let loading = $state(true);
	let error = $state('');
	let page = $state(1);
	let threshold = $state(50);
	const limit = 20;

	async function loadData() {
		loading = true;
		error = '';
		try {
			data = await lmsStore.getCurriculumStudentsAtRisk(page, limit, threshold);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : 'Gagal memuat data';
			error = msg;
		} finally {
			loading = false;
		}
	}

	$effect(() => { loadData(); });

	function onPageChange(p: number) { page = p; loadData(); }

	const totalPages = $derived(data ? Math.ceil(data.total / limit) : 0);

	const flagLabels: Record<string, string> = {
		low_submission: 'Tugas Rendah',
		low_reading: 'Materi Rendah',
		low_quiz: 'Kuis Rendah',
		low_grade: 'Nilai Rendah',
	};
</script>

<svelte:head>
	<title>Deteksi Siswa - Akademik-BN</title>
</svelte:head>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<h2 class="text-display-lg-mobile font-black tracking-tight text-on-surface uppercase md:text-display-lg">
			Deteksi Dini Siswa
		</h2>
		<p class="font-body-md text-secondary">Identifikasi siswa yang membutuhkan perhatian lebih.</p>
	</div>
</div>

<!-- Threshold Filter -->
<div class="mb-4 flex flex-wrap items-center gap-3">
	<span class="font-label-bold text-[10px] text-secondary uppercase">Threshold:</span>
	{#each [30, 40, 50, 60, 70] as t}
		<button
			class="cursor-pointer px-3 py-1.5 font-label-bold text-[10px] uppercase neo-border transition-all {threshold === t ? 'bg-primary-container text-on-primary-container shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-surface-container text-secondary hover:bg-surface-container-lowest'}"
			onclick={() => { threshold = t; page = 1; loadData(); }}
		>
			{t}%
		</button>
	{/each}
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
	<!-- Summary -->
	<div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
		<div class="bg-surface-container-lowest p-3 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] neo-border">
			<p class="font-label-bold text-[9px] text-secondary uppercase">Total Siswa</p>
			<p class="font-headline-md text-lg font-bold">{data.summary.totalStudents}</p>
		</div>
		<div class="bg-surface-container-lowest p-3 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] neo-border border-l-4 border-l-warning">
			<p class="font-label-bold text-[9px] text-warning uppercase">Berisiko</p>
			<p class="font-headline-md text-lg font-bold text-warning">{data.summary.totalAtRisk}</p>
		</div>
		<div class="bg-surface-container-lowest p-3 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] neo-border border-l-4 border-l-error">
			<p class="font-label-bold text-[9px] text-error uppercase">Kritis</p>
			<p class="font-headline-md text-lg font-bold text-error">{data.summary.totalCritical}</p>
		</div>
		<div class="bg-surface-container-lowest p-3 shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] neo-border">
			<p class="font-label-bold text-[9px] text-secondary uppercase">Threshold</p>
			<p class="font-headline-md text-lg font-bold">{threshold}%</p>
		</div>
	</div>

	<!-- At-Risk Students Table -->
	<div class="overflow-x-auto bg-surface-container-lowest shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] neo-border">
		<table class="w-full text-left text-xs">
			<thead>
				<tr class="border-b-2 border-on-surface font-label-bold text-[10px] text-secondary uppercase tracking-wider">
					<th class="p-3">Siswa</th>
					<th class="hidden p-3 sm:table-cell">Kelas</th>
					<th class="hidden p-3 md:table-cell">Tugas</th>
					<th class="hidden p-3 md:table-cell">Materi</th>
					<th class="hidden p-3 md:table-cell">Kuis</th>
					<th class="hidden p-3 sm:table-cell">Nilai Rata</th>
					<th class="p-3">Penanda</th>
				</tr>
			</thead>
			<tbody>
				{#each data.data as s}
					<tr class="border-b border-on-surface/20 transition-colors hover:bg-primary-container/10 {s.severity === 'critical' ? 'bg-[#FEE2E2]/30' : ''}">
						<td class="p-3">
							<p class="font-label-bold text-xs">{s.fullname}</p>
							{#if s.nis}<p class="font-label-bold text-[8px] text-secondary">NIS: {s.nis}</p>{/if}
						</td>
						<td class="hidden p-3 sm:table-cell"><span class="font-label-bold text-[10px]">{s.className}</span></td>
						<td class="hidden p-3 md:table-cell">
							<Badge variant={s.stats.submissionRate < 30 ? 'error' : s.stats.submissionRate < 50 ? 'warning' : 'success'} size="xs">
								{s.stats.submissionRate}%
							</Badge>
						</td>
						<td class="hidden p-3 md:table-cell">
							<Badge variant={s.stats.materialReadRate < 30 ? 'error' : s.stats.materialReadRate < 50 ? 'warning' : 'success'} size="xs">
								{s.stats.materialReadRate}%
							</Badge>
						</td>
						<td class="hidden p-3 md:table-cell">
							<Badge variant={s.stats.quizCompletionRate < 30 ? 'error' : s.stats.quizCompletionRate < 50 ? 'warning' : 'success'} size="xs">
								{s.stats.quizCompletionRate}%
							</Badge>
						</td>
						<td class="hidden p-3 sm:table-cell">
							{#if s.stats.averageGrade !== null}
								<Badge variant={s.stats.averageGrade < 75 ? 'error' : 'success'} size="xs">{s.stats.averageGrade}</Badge>
							{:else}
								<span class="text-secondary">-</span>
							{/if}
						</td>
						<td class="p-3">
							<div class="flex flex-wrap gap-1">
								<Badge variant={s.severity === 'critical' ? 'error' : 'warning'} size="xs">{s.severity}</Badge>
								{#each s.flags as f}
									<span class="font-label-bold text-[8px] text-secondary">{flagLabels[f] ?? f}</span>
								{/each}
							</div>
						</td>
					</tr>
				{/each}
				{#if data.data.length === 0}
					<tr><td colspan="7" class="p-6 text-center text-xs text-success">Tidak ada siswa terdeteksi berisiko pada threshold {threshold}%.</td></tr>
				{/if}
			</tbody>
		</table>
	</div>

	{#if totalPages > 1}
		<div class="mt-4 flex justify-center">
			<Pagination currentPage={page} {totalPages} totalItems={data?.total ?? 0} itemsPerPage={limit} onPageChange={onPageChange} />
		</div>
	{/if}
{/if}
