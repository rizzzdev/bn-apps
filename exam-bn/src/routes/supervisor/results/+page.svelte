<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import Pagination from '$lib/components/Pagination.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { exportToExcel, exportToExcelMultiSheet } from '$lib/utils/export';
	import { resolveBackendUrl } from '$lib/utils/backend-url';

	let { data }: { data: PageData } = $props();
	let page = $state(1);
	const PAGE_SIZE = 5;

	const API = resolveBackendUrl() + '/api/v1';
	const WIB: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta' };

	type ParticipantResult = {
		userId: string;
		fullname: string;
		email: string;
		score: number | null;
		submitted: boolean;
		examRoomId: string;
	};

	type ExamResult = {
		examId: string;
		examName: string;
		startTime: string;
		endTime: string;
		passingGrade: number;
		participants: ParticipantResult[];
	};

	const examResults = $derived(data.examResults as ExamResult[]);
	const paginatedExamResults = $derived(
		examResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
	);

	function avg(participants: ParticipantResult[]): string {
		if (participants.length === 0) return '-';
		const total = participants.reduce(
			(sum, p) => sum + (p.submitted ? (displayScore(p) ?? 0) : 0),
			0
		);
		return (total / participants.length).toFixed(1);
	}

	let scoreOverrides = $state<Record<string, number | null>>({});
	let recalculating = $state<Record<string, boolean>>({});

	async function recalculate(participant: ParticipantResult, exam: ExamResult) {
		const key = `${participant.examRoomId}:${participant.userId}`;
		recalculating = { ...recalculating, [key]: true };
		try {
		// Don't send bobot here: the server recomputes using the weights that were
		// set during "Koreksi Esai", so recalculation never resets them.
		const res = await fetch(
			`${API}/exam/exam-rooms/${participant.examRoomId}/grade/${participant.userId}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
				body: JSON.stringify({})
			}
		);
			const json = await res.json();
			if (!json.error) scoreOverrides = { ...scoreOverrides, [key]: json.data.score };
		} finally {
			recalculating = { ...recalculating, [key]: false };
		}
	}

	function isFinished(exam: ExamResult): boolean {
		return new Date(exam.endTime) < new Date();
	}

	async function recalculateAll(exam: ExamResult) {
		// For finished exams, grade ALL participants (absent ones get 0).
		// For ongoing exams, only grade those who submitted.
		const targets = isFinished(exam)
			? exam.participants
			: exam.participants.filter((p) => p.submitted);
		await Promise.all(targets.map((p) => recalculate(p, exam)));
	}

	onMount(() => {
		// Auto-assign 0 to absent participants for every already-finished exam.
		for (const exam of examResults) {
			if (!isFinished(exam)) continue;
			const absent = exam.participants.filter((p) => !p.submitted);
			if (absent.length === 0) continue;
			Promise.all(absent.map((p) => recalculate(p, exam)));
		}
	});

	function isRecalculating(examRoomId: string, userId: string) {
		return !!recalculating[`${examRoomId}:${userId}`];
	}

	function displayScore(p: ParticipantResult): number | null {
		const key = `${p.examRoomId}:${p.userId}`;
		return key in scoreOverrides ? scoreOverrides[key] : p.score;
	}

	const EXAM_HEADERS = ['No', 'Nama Lengkap', 'Email', 'Nilai', 'Status'];
	const EXAM_KEYS = ['no', 'fullname', 'email', 'score', 'status'];

	function examRows(exam: ExamResult) {
		return exam.participants.map((p, i) => {
			const score = displayScore(p);
			const hasBeenGraded = p.submitted || `${p.examRoomId}:${p.userId}` in scoreOverrides;
			const scoreVisible = score !== null && hasBeenGraded;
			return {
				no: i + 1,
				fullname: p.fullname,
				email: p.email,
				score: scoreVisible ? score : p.submitted ? 'Belum dinilai' : 'Tidak hadir',
				status: scoreVisible
					? score! >= exam.passingGrade
						? 'Lulus'
						: 'Tidak Lulus'
					: p.submitted
						? 'Belum dinilai'
						: 'Tidak hadir'
			};
		});
	}

	function exportExam(exam: ExamResult) {
		const safeName = exam.examName.replace(/[^a-zA-Z0-9_\-]/g, '_');
		exportToExcel(`hasil_${safeName}`, exam.examName, EXAM_HEADERS, examRows(exam), EXAM_KEYS);
	}

	function exportAll() {
		const sheets = examResults.map((exam) => ({
			name: exam.examName.substring(0, 31),
			headers: EXAM_HEADERS,
			rows: examRows(exam),
			keys: EXAM_KEYS
		}));
		exportToExcelMultiSheet('semua_hasil_supervisor', sheets);
	}
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
	<div>
		<h1 class="text-2xl font-black text-(--text-primary)">Hasil Ujian</h1>
		<p class="text-sm font-medium text-(--text-secondary) mt-1">
			Rekap nilai peserta untuk soal yang Anda buat.
		</p>
	</div>
	{#if examResults.length > 0}
		<div class="flex gap-2 flex-wrap">
			<a href="/supervisor/statistics" class="btn-secondary text-sm gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
					/>
				</svg>
				Statistik
			</a>
			<button onclick={exportAll} class="btn-primary text-sm gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
					/>
				</svg>
				Export Semua (Excel)
			</button>
		</div>
	{/if}
</div>

{#if examResults.length === 0}
	<div class="card p-10 text-center font-bold text-(--text-secondary)">
		Anda belum ditugaskan sebagai pembuat soal di ujian manapun.
	</div>
{:else}
	<div class="space-y-6">
		{#each paginatedExamResults as exam (exam.examId)}
			<Table>
				{#snippet header()}
					<div class="card-header flex items-center justify-between gap-4 flex-wrap">
						<div class="min-w-0">
							<h2 class="text-base font-black text-(--text-primary)">{exam.examName}</h2>
							<p class="text-xs font-medium text-(--text-secondary) mt-0.5">
								{new Date(exam.startTime).toLocaleString('id-ID', WIB)} — {new Date(
									exam.endTime
								).toLocaleString('id-ID', WIB)}
							</p>
						</div>
						<div class="flex items-center gap-4 shrink-0 flex-wrap">
							<div class="text-xs font-medium text-(--text-secondary) text-right space-y-0.5">
								<div>
									Rata-rata: <strong class="font-black text-(--text-primary)"
										>{avg(exam.participants)}</strong
									>
								</div>
								<div>
									{exam.participants.filter((p) => p.submitted).length}/{exam.participants.length} mengumpulkan
								</div>
								<div>
									KKM: <span class="font-black text-(--text-primary)">{exam.passingGrade}</span>
								</div>
							</div>
							<button
								onclick={() => exportExam(exam)}
								class="btn-secondary text-xs gap-1.5 px-3 py-1.5"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								Excel
							</button>
							<Button
								variant="secondary"
								size="sm"
								onclick={() => recalculateAll(exam)}
								disabled={exam.participants
									.filter((p) => p.submitted)
									.some((p) => isRecalculating(p.examRoomId, p.userId))}>Hitung Ulang Semua</Button
							>
						</div>
					</div>
				{/snippet}

				{#snippet head()}
					<tr>
						<th class="w-8">#</th>
						<th>Nama</th>
						<th>Email</th>
						<th class="text-right">Nilai</th>
						<th class="text-center">Status</th>
						<th class="text-right">Aksi</th>
					</tr>
				{/snippet}

				{#if exam.participants.length === 0}
					<tr>
						<td colspan="6" class="px-5 py-8 text-center font-bold text-(--text-secondary)"
							>Belum ada peserta terdaftar.</td
						>
					</tr>
				{/if}
				{#each exam.participants as p, idx (p.userId)}
					{@const score = displayScore(p)}
					{@const hasBeenGraded = p.submitted || `${p.examRoomId}:${p.userId}` in scoreOverrides}
					{@const scoreVisible = score !== null && hasBeenGraded}
					{@const passed = scoreVisible && score! >= exam.passingGrade}
					<tr>
						<td class="font-bold text-(--text-secondary) w-8">{idx + 1}</td>
						<td class="font-black text-(--text-primary) whitespace-nowrap">{p.fullname}</td>
						<td class="font-medium text-(--text-secondary) whitespace-nowrap">{p.email}</td>
						<td class="text-right whitespace-nowrap">
							{#if scoreVisible}
								<span
									class="font-black {score! >= exam.passingGrade
										? 'text-green-600'
										: score! >= 50
											? 'text-amber-600'
											: 'text-red-600'}">{score}</span
								>
							{:else if p.submitted}
								<span class="text-(--text-secondary) text-xs italic">Belum dinilai</span>
							{:else}
								<span class="text-(--text-secondary)">—</span>
							{/if}
						</td>
						<td class="text-center whitespace-nowrap">
							{#if scoreVisible}
								<Badge variant={passed ? 'success' : 'danger'}
									>{passed ? 'Lulus' : 'Tidak Lulus'}</Badge
								>
							{:else if !p.submitted}
								<Badge>Tidak Hadir</Badge>
							{:else}
								<span class="text-(--text-secondary)">—</span>
							{/if}
						</td>
						<td class="text-right whitespace-nowrap">
							<div class="inline-flex items-center gap-1">
								{#if p.submitted}
									<IconButton
										variant="primary-outline"
										title="Lihat Jawaban"
										href="/supervisor/results/{p.examRoomId}/answers/{p.userId}"
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									</IconButton>
									<IconButton
										variant="secondary"
										title="Hitung Ulang"
										onclick={() => recalculate(p, exam)}
										disabled={isRecalculating(p.examRoomId, p.userId)}
										loading={isRecalculating(p.examRoomId, p.userId)}
									>
										<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
											/>
										</svg>
									</IconButton>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</Table>
		{/each}
	</div>

	{#if examResults.length > PAGE_SIZE}
		<div class="mt-4">
			<Pagination bind:page total={examResults.length} pageSize={PAGE_SIZE} />
		</div>
	{/if}
{/if}
