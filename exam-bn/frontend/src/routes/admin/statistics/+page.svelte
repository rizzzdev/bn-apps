<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageData } from './$types';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { exportToExcel } from '$lib/utils/export';

	let { data }: { data: PageData } = $props();

	const WIB: Intl.DateTimeFormatOptions = {
		timeZone: 'Asia/Jakarta',
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	};

	// Default selection — a one-time snapshot of the initial load, not meant
	// to track `data` reactively (the user picks freely afterward).
	let selectedExamId = $state<string | null>(untrack(() => data.examStats[0]?.examId ?? null));

	const selectedExam = $derived(data.examStats.find((e) => e.examId === selectedExamId) ?? null);
	const maxBucketCount = $derived(
		selectedExam ? Math.max(...selectedExam.buckets.map((b) => b.count), 1) : 1
	);

	// Global summary across all exams
	const globalStats = $derived.by(() => {
		const all = data.examStats;
		const totalParticipants = all.reduce((s, e) => s + e.totalParticipants, 0);
		const totalSubmitted = all.reduce((s, e) => s + e.submitted, 0);
		const totalPassed = all.reduce((s, e) => s + e.passed, 0);
		const totalFailed = all.reduce((s, e) => s + e.failedTotal, 0);
		const allAvgs = all.filter((e) => e.avg !== null).map((e) => e.avg!);
		const globalAvg =
			allAvgs.length > 0
				? Math.round((allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) * 10) / 10
				: null;
		return {
			totalParticipants,
			totalSubmitted,
			totalPassed,
			totalFailed,
			globalAvg,
			totalExams: all.length
		};
	});

	function scoreColor(score: number | null, passing: number): string {
		if (score === null) return 'text-(--text-secondary)';
		if (score >= passing) return 'text-green-600';
		if (score >= 50) return 'text-amber-600';
		return 'text-red-600';
	}

	function exportStats() {
		const rows = data.examStats.map((e, i) => ({
			no: i + 1,
			examName: e.examName,
			date: new Date(e.startTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
			totalParticipants: e.totalParticipants,
			submitted: e.submitted,
			scored: e.scored,
			pendingGrade: e.pendingGrade,
			notSubmitted: e.notSubmitted,
			passed: e.passed,
			failed: e.failedTotal,
			passRate: e.totalParticipants > 0 ? Math.round((e.passed / e.totalParticipants) * 100) : null,
			avg: e.avg,
			min: e.min,
			max: e.max,
			passingGrade: e.passingGrade
		}));
		exportToExcel(
			'statistik_ujian',
			'Statistik Ujian',
			[
				'No',
				'Nama Ujian',
				'Tanggal',
				'Total Peserta',
				'Mengumpulkan',
				'Sudah Dinilai',
				'Belum Dinilai',
				'Tidak Hadir',
				'Lulus',
				'Tidak Lulus',
				'Pass Rate (%)',
				'Rata-rata',
				'Min',
				'Max',
				'KKM'
			],
			rows,
			[
				'no',
				'examName',
				'date',
				'totalParticipants',
				'submitted',
				'scored',
				'pendingGrade',
				'notSubmitted',
				'passed',
				'failed',
				'passRate',
				'avg',
				'min',
				'max',
				'passingGrade'
			]
		);
	}
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
	<div>
		<h1 class="text-2xl font-black text-(--text-primary)">Statistik Ujian</h1>
		<p class="text-sm font-medium text-(--text-secondary) mt-1">
			Analisis distribusi nilai dan performa peserta.
		</p>
	</div>
	{#if data.examStats.length > 0}
		<button onclick={exportStats} class="btn-secondary text-sm gap-2">
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
				/>
			</svg>
			Export Excel
		</button>
	{/if}
</div>

{#if data.examStats.length === 0}
	<div class="card p-10 text-center font-bold text-(--text-secondary)">
		Belum ada data ujian untuk ditampilkan statistiknya.
	</div>
{:else}
	<!-- Global Summary Cards -->
	{@const g = globalStats}
	<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
		<div class="card p-4 text-center">
			<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Total Ujian</p>
			<p class="text-2xl font-black text-primary-500 mt-1">{g.totalExams}</p>
		</div>
		<div class="card p-4 text-center">
			<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">
				Total Peserta
			</p>
			<p class="text-2xl font-black text-primary-500 mt-1">{g.totalParticipants}</p>
		</div>
		<div class="card p-4 text-center">
			<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Mengumpulkan</p>
			<p class="text-2xl font-black text-blue-500 mt-1">{g.totalSubmitted}</p>
		</div>
		<div class="card p-4 text-center">
			<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Lulus</p>
			<p class="text-2xl font-black text-green-600 mt-1">{g.totalPassed}</p>
		</div>
		<div class="card p-4 text-center">
			<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">Tidak Lulus</p>
			<p class="text-2xl font-black text-red-600 mt-1">{g.totalFailed}</p>
		</div>
		<div class="card p-4 text-center">
			<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">
				Rata-rata Global
			</p>
			<p class="text-2xl font-black text-primary-500 mt-1">{g.globalAvg ?? '—'}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
		<!-- Exam selector list -->
		<div class="card overflow-hidden xl:col-span-1">
			<div class="card-header">
				<h2 class="text-sm font-black text-(--text-primary)">Pilih Ujian</h2>
			</div>
			<div class="divide-y-2 divide-(--nb-border) max-h-128 overflow-y-auto">
				{#each data.examStats as exam (exam.examId)}
					<button
						class="w-full text-left px-4 py-3 transition-colors duration-100 hover:bg-(--bg-secondary) {selectedExamId ===
						exam.examId
							? 'bg-(--bg-secondary) border-l-4 border-primary-500'
							: 'border-l-4 border-transparent'}"
						onclick={() => (selectedExamId = exam.examId)}
					>
						<p class="text-sm font-black text-(--text-primary) truncate">{exam.examName}</p>
						<p class="text-xs font-medium text-(--text-secondary) mt-0.5">
							{new Date(exam.startTime).toLocaleString('id-ID', WIB)}
						</p>
						<div class="flex items-center gap-2 mt-1">
							{#if exam.avg !== null}
								<span class="text-xs font-black {scoreColor(exam.avg, exam.passingGrade)}"
									>Avg: {exam.avg}</span
								>
							{/if}
							{#if exam.totalParticipants > 0}
								<span class="text-xs font-medium text-(--text-secondary)">
									{Math.round((exam.passed / exam.totalParticipants) * 100)}% lulus
								</span>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>

		<!-- Detail panel -->
		<div class="xl:col-span-3 space-y-6">
			{#if selectedExam}
				<!-- Exam header -->
				<div class="card p-5">
					<h2 class="text-lg font-black text-(--text-primary)">{selectedExam.examName}</h2>
					<p class="text-xs font-medium text-(--text-secondary) mt-0.5">
						{new Date(selectedExam.startTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} —
						{new Date(selectedExam.endTime).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
						· KKM:
						<strong class="font-black text-(--text-primary)">{selectedExam.passingGrade}</strong>
					</p>
				</div>

				<!-- Key metrics -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
					<div class="card p-4 text-center">
						<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">
							Rata-rata
						</p>
						<p
							class="text-3xl font-black mt-1 {scoreColor(
								selectedExam.avg,
								selectedExam.passingGrade
							)}"
						>
							{selectedExam.avg ?? '—'}
						</p>
					</div>
					<div class="card p-4 text-center">
						<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">
							Tertinggi
						</p>
						<p class="text-3xl font-black text-green-600 mt-1">{selectedExam.max ?? '—'}</p>
					</div>
					<div class="card p-4 text-center">
						<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">
							Terendah
						</p>
						<p class="text-3xl font-black text-red-600 mt-1">{selectedExam.min ?? '—'}</p>
					</div>
					<div class="card p-4 text-center">
						<p class="text-xs font-black text-(--text-secondary) uppercase tracking-wide">
							Pass Rate
						</p>
						<p
							class="text-3xl font-black mt-1 {selectedExam.totalParticipants > 0 &&
							selectedExam.passed / selectedExam.totalParticipants >= 0.7
								? 'text-green-600'
								: 'text-amber-600'}"
						>
							{selectedExam.totalParticipants > 0
								? Math.round((selectedExam.passed / selectedExam.totalParticipants) * 100) + '%'
								: '—'}
						</p>
					</div>
				</div>

				<!-- Participation breakdown -->
				<div class="card overflow-hidden">
					<div class="card-header">
						<h3 class="text-sm font-black text-(--text-primary)">Partisipasi Peserta</h3>
					</div>
					<div class="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
						<div>
							<p class="text-2xl font-black text-(--text-primary)">
								{selectedExam.totalParticipants}
							</p>
							<p class="text-xs font-medium text-(--text-secondary) mt-0.5">Terdaftar</p>
						</div>
						<div>
							<p class="text-2xl font-black text-blue-500">{selectedExam.submitted}</p>
							<p class="text-xs font-medium text-(--text-secondary) mt-0.5">Mengumpulkan</p>
						</div>
						<div>
							<p class="text-2xl font-black text-amber-500">{selectedExam.pendingGrade}</p>
							<p class="text-xs font-medium text-(--text-secondary) mt-0.5">Belum Dinilai</p>
						</div>
						<div>
							<p class="text-2xl font-black text-(--text-secondary)">{selectedExam.notSubmitted}</p>
							<p class="text-xs font-medium text-(--text-secondary) mt-0.5">Tidak Hadir</p>
						</div>
					</div>

					<!-- Participation progress bar -->
					{#if selectedExam.totalParticipants > 0}
						{@const submittedPct = Math.round(
							(selectedExam.submitted / selectedExam.totalParticipants) * 100
						)}
						{@const notSubmittedPct = 100 - submittedPct}
						<div class="px-5 pb-5">
							<div class="h-4 flex border-2 border-(--nb-border) overflow-hidden rounded-sm">
								<div
									class="bg-blue-500 transition-all duration-500"
									style="width: {submittedPct}%"
								></div>
								<div class="bg-(--bg-secondary) flex-1"></div>
							</div>
							<p class="text-xs font-medium text-(--text-secondary) mt-1">
								{submittedPct}% mengumpulkan · {notSubmittedPct}% tidak hadir
							</p>
						</div>
					{/if}
				</div>

				<!-- Pass/Fail breakdown -->
				{#if selectedExam.totalParticipants > 0}
					{@const passedPct = Math.round(
						(selectedExam.passed / selectedExam.totalParticipants) * 100
					)}
					{@const failedPct = 100 - passedPct}
					<div class="card overflow-hidden">
						<div class="card-header">
							<h3 class="text-sm font-black text-(--text-primary)">Kelulusan</h3>
						</div>
						<div class="p-5">
							<div class="flex items-center gap-4 mb-3">
								<div class="flex-1">
									<div class="h-8 flex border-2 border-(--nb-border) overflow-hidden rounded-sm">
										<div
											class="bg-green-500 flex items-center justify-center text-xs font-black text-white transition-all duration-500"
											style="width: {passedPct}%; min-width: {passedPct > 0 ? '2rem' : '0'}"
										>
											{#if passedPct > 10}{passedPct}%{/if}
										</div>
										<div
											class="bg-red-500 flex items-center justify-center text-xs font-black text-white flex-1 transition-all duration-500"
										>
											{#if failedPct > 10}{failedPct}%{/if}
										</div>
									</div>
								</div>
							</div>
							<div class="flex gap-6">
								<div class="flex items-center gap-2">
									<span class="w-4 h-4 bg-green-500 border-2 border-(--nb-border) shrink-0"></span>
									<span class="text-sm font-bold text-(--text-primary)"
										>Lulus: <strong class="text-green-600">{selectedExam.passed}</strong></span
									>
								</div>
								<div class="flex items-center gap-2">
									<span class="w-4 h-4 bg-red-500 border-2 border-(--nb-border) shrink-0"></span>
									<span class="text-sm font-bold text-(--text-primary)"
										>Tidak Lulus: <strong class="text-red-600">{selectedExam.failedTotal}</strong
										></span
									>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Score distribution histogram -->
				{#if selectedExam.scored > 0}
					<div class="card overflow-hidden">
						<div class="card-header">
							<h3 class="text-sm font-black text-(--text-primary)">Distribusi Nilai</h3>
							<p class="text-xs font-medium text-(--text-secondary) mt-0.5">
								KKM = {selectedExam.passingGrade}
							</p>
						</div>
						<div class="p-5">
							<div class="flex items-end gap-2 h-40">
								{#each selectedExam.buckets as bucket, i}
									{@const pct = maxBucketCount > 0 ? (bucket.count / maxBucketCount) * 100 : 0}
									{@const bucketStart = i * 10}
									{@const isPassing =
										bucketStart >= selectedExam.passingGrade ||
										(bucketStart + 9 >= selectedExam.passingGrade &&
											bucketStart < selectedExam.passingGrade)}
									{@const isFullyPassing = bucketStart >= selectedExam.passingGrade}
									<div class="flex-1 flex flex-col items-center gap-1">
										{#if bucket.count > 0}
											<span class="text-xs font-black text-(--text-secondary)">{bucket.count}</span>
										{:else}
											<span class="text-xs text-(--text-secondary)"></span>
										{/if}
										<div
											class="w-full transition-all duration-500 border-2 border-(--nb-border) {isFullyPassing
												? 'bg-green-500'
												: 'bg-red-400'}"
											style="height: {Math.max(pct, bucket.count > 0 ? 4 : 0)}%"
											title="{bucket.label}: {bucket.count} peserta"
										></div>
										<span
											class="text-xs font-medium text-(--text-secondary) whitespace-nowrap"
											style="font-size: 10px">{bucket.label}</span
										>
									</div>
								{/each}
							</div>
							<div class="flex gap-4 mt-3">
								<div class="flex items-center gap-2">
									<span class="w-4 h-4 bg-green-500 border-2 border-(--nb-border) shrink-0"></span>
									<span class="text-xs font-medium text-(--text-secondary)">≥ KKM</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="w-4 h-4 bg-red-400 border-2 border-(--nb-border) shrink-0"></span>
									<span class="text-xs font-medium text-(--text-secondary)">&lt; KKM</span>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Summary table of all exams -->
				<div class="card overflow-hidden">
					<div class="card-header">
						<h3 class="text-sm font-black text-(--text-primary)">Ringkasan Semua Ujian</h3>
					</div>
					<div class="overflow-x-auto">
						<table class="nb-table w-full text-sm">
							<thead>
								<tr>
									<th class="text-left">Ujian</th>
									<th class="text-center">Peserta</th>
									<th class="text-center">Kumpul</th>
									<th class="text-center">Rata-rata</th>
									<th class="text-center">Lulus</th>
									<th class="text-center">Pass Rate</th>
								</tr>
							</thead>
							<tbody>
								{#each data.examStats as e (e.examId)}
									<tr
										class="cursor-pointer {e.examId === selectedExamId
											? 'bg-(--bg-secondary)'
											: ''}"
										onclick={() => (selectedExamId = e.examId)}
									>
										<td>
											<p class="font-black text-(--text-primary) truncate max-w-48">{e.examName}</p>
											<p class="text-xs font-medium text-(--text-secondary)">
												{new Date(e.startTime).toLocaleDateString('id-ID', WIB)}
											</p>
										</td>
										<td class="text-center font-bold text-(--text-primary)"
											>{e.totalParticipants}</td
										>
										<td class="text-center">
											<span
												class="font-bold {e.submitted === e.totalParticipants
													? 'text-green-600'
													: 'text-(--text-primary)'}">{e.submitted}</span
											>
											<span class="text-(--text-secondary) text-xs">/{e.totalParticipants}</span>
										</td>
										<td class="text-center font-black {scoreColor(e.avg, e.passingGrade)}">
											{e.avg ?? '—'}
										</td>
										<td class="text-center">
											{#if e.totalParticipants > 0}
												<span class="font-black text-green-600">{e.passed}</span>
												<span class="text-(--text-secondary) text-xs">/{e.totalParticipants}</span>
											{:else}
												<span class="text-(--text-secondary)">—</span>
											{/if}
										</td>
										<td class="text-center">
											{#if e.totalParticipants > 0}
												{@const rate = Math.round((e.passed / e.totalParticipants) * 100)}
												<Badge
													variant={rate >= 70 ? 'success' : rate >= 50 ? 'warning' : 'danger'}
													class="font-black"
												>
													{rate}%
												</Badge>
											{:else}
												<span class="text-(--text-secondary)">—</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{:else}
				<div class="card p-10 text-center font-bold text-(--text-secondary)">
					Pilih ujian dari daftar untuk melihat statistiknya.
				</div>
			{/if}
		</div>
	</div>
{/if}
