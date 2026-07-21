<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import Alert from '$lib/components/ui/Alert.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { addToast } from '$lib/stores/toast';
	import type { ExamAnswer, EssayGrade } from '$lib/types';

	let { data, form }: { data: any; form: any } = $props();

	type EssayQuestion = {
		id: string;
		questionId: string;
		questionNumber: number;
		question?: { id: string; text: string; type: string };
	};
	type ParticipantRow = {
		userId: string;
		fullname: string;
		username: string;
		score: number | null;
		answers: ExamAnswer[];
		grades: Record<string, EssayGrade>;
	};

	const essayQuestions = $derived(data.essayQuestions as EssayQuestion[]);
	// Seeded once on mount, then mutated locally as grades are saved.
	let participantData = $state<ParticipantRow[]>([]);
	let mcPct = $state(100);
	let essayPct = $derived(100 - mcPct);
	const mcWeight = $derived(mcPct / 100);
	const essayWeight = $derived(essayPct / 100);

	let openUserId = $state<string | null>(null);
	let submitting = $state(false);
	let pointsState = $state<Record<string, Record<string, number>>>({});

	function initPoints(p: ParticipantRow) {
		if (!pointsState[p.userId]) {
			const map: Record<string, number> = {};
			for (const eq of essayQuestions) {
				map[eq.questionId] = p.grades[eq.questionId]?.points ?? 0;
			}
			pointsState[p.userId] = map;
		}
	}

	function openPanel(p: ParticipantRow) {
		openUserId = p.userId;
		initPoints(p);
	}

	function getAnswer(p: ParticipantRow, questionId: string): string {
		return (p.answers.find((a: any) => a.questionId === questionId)?.text ?? '') || '—';
	}

	$effect(() => {
		participantData = data.participantData as ParticipantRow[];
		mcPct = data.mcWeight !== null ? Math.round((data.mcWeight ?? 1) * 100) : 100;
	});

	function makeEnhance(userId: string) {
		return () => {
			submitting = true;
			return async ({ update, result }: any) => {
				submitting = false;
				if (result.type === 'success') {
					addToast(result.data?.message ?? 'Nilai disimpan.', 'success');
					const newScore = result.data?.score;
					if (newScore !== undefined) {
						participantData = participantData.map((p) =>
							p.userId === userId ? { ...p, score: newScore } : p
						);
					}
				} else if (result.type === 'failure') {
					addToast(result.data?.error ?? 'Terjadi kesalahan.', 'error');
				}
				await update({ invalidateAll: true });
			};
		};
	}
</script>

<div class="mb-6">
	<a
		href="/supervisor/grading"
		class="inline-flex items-center gap-1 text-sm font-bold mb-2 text-primary-500 transition-all duration-100 hover:-translate-x-0.5"
	>
		<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
		</svg>
		Kembali
	</a>
	<h1 class="text-2xl font-black text-(--text-primary)">Koreksi Esai</h1>
	<p class="text-sm font-medium text-(--text-secondary) mt-1">
		{data.examRoom?.exam?.name ?? '-'} — {data.examRoom?.room?.name ?? '-'}
	</p>
</div>

<!-- Bobot Nilai -->
<div class="card p-5 mb-6">
	<h2 class="text-sm font-black text-(--text-primary) mb-3 pb-2 border-b-2 border-(--nb-border)">
		Bobot Nilai
	</h2>
	<div class="flex items-center gap-4 flex-wrap">
		<label class="flex items-center gap-2 text-sm font-bold text-(--text-primary)">
			Bobot MC:
			<input
				type="number"
				min="0"
				max="100"
				step="5"
				bind:value={mcPct}
				class="input-field w-20 text-center"
			/>
			%
		</label>
		<span class="font-black text-(--text-secondary)">+</span>
		<span class="text-sm font-bold text-(--text-primary)">
			Bobot Esai: <span class="font-black text-primary-500">{essayPct}%</span>
		</span>
		{#if mcPct + essayPct !== 100}
			<Badge variant="danger">Total harus 100%</Badge>
		{:else}
			<Badge variant="success">✓ Total 100%</Badge>
		{/if}
	</div>
	<p class="text-xs font-medium text-(--text-secondary) mt-2">
		Nilai akhir = (Skor MC × {mcPct}%) + (Skor Esai × {essayPct}%)
	</p>
</div>

{#if participantData.length === 0}
	<div class="card p-10 text-center font-bold text-(--text-secondary)">
		Belum ada peserta yang mengumpulkan ujian.
	</div>
{:else}
	<div class="space-y-4">
		{#each participantData as p (p.userId)}
			{@const isOpen = openUserId === p.userId}
			<div class="card overflow-hidden">
				<button
					class="w-full px-5 py-4 flex items-center justify-between text-left transition-colors duration-100 hover:bg-(--bg-secondary)"
					onclick={() => (isOpen ? (openUserId = null) : openPanel(p))}
				>
					<div class="flex items-center gap-3">
						<div
							class="avatar-pill w-9 h-9 flex items-center justify-center font-black text-sm text-white shrink-0"
						>
							{p.fullname.charAt(0).toUpperCase()}
						</div>
						<div>
							<p class="font-black text-(--text-primary)">{p.fullname}</p>
							<p class="text-xs font-medium text-(--text-secondary)">{p.username}</p>
						</div>
					</div>
					<div class="flex items-center gap-4 shrink-0">
						{#if p.score !== null}
							<Badge
								variant={p.score >= 75 ? 'success' : p.score >= 50 ? 'warning' : 'danger'}
								class="font-black"
							>
								{p.score}
							</Badge>
						{:else}
							<span class="text-xs font-bold text-(--text-secondary) italic">Belum dinilai</span>
						{/if}
						<svg
							class="w-4 h-4 text-(--text-secondary) transition-transform duration-200 {isOpen
								? 'rotate-180'
								: ''}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</button>

				{#if isOpen}
					<div class="card-footer px-5 py-5">
						<form
							method="POST"
							action="?/grade"
							use:enhance={makeEnhance(p.userId)}
							class="space-y-5"
						>
							<input type="hidden" name="examRoomId" value={data.examRoomId} />
							<input type="hidden" name="userId" value={p.userId} />
							<input type="hidden" name="mcWeight" value={mcWeight} />
							<input type="hidden" name="essayWeight" value={essayWeight} />

							{#each essayQuestions as eq (eq.id)}
								<input type="hidden" name="questionId" value={eq.questionId} />
								<div class="p-4 border-2 border-(--nb-border) bg-(--bg-secondary)">
									<div class="flex items-start justify-between gap-4 mb-3">
										<div class="flex-1">
											<p class="text-xs font-black text-(--text-secondary) mb-1">
												Soal {eq.questionNumber}
											</p>
											<p class="text-sm font-medium text-(--text-primary)">
												{eq.question?.text ?? '-'}
											</p>
										</div>
										<div class="shrink-0 flex flex-col items-end gap-1">
											<label
												for="points-{p.userId}-{eq.questionId}"
												class="text-xs font-black text-(--text-secondary)">Poin (0–10)</label
											>
											<input
												id="points-{p.userId}-{eq.questionId}"
												type="number"
												name="points"
												min="0"
												max="10"
												step="1"
												bind:value={pointsState[p.userId][eq.questionId]}
												class="input-field w-16 text-center"
											/>
											<span class="text-xs font-bold text-(--text-secondary)">/ 10</span>
										</div>
									</div>
									<div class="p-3 border-2 border-(--nb-border) bg-(--nb-card-bg)">
										<p class="text-xs font-black text-(--text-secondary) mb-1">Jawaban peserta:</p>
										<p class="text-sm font-medium text-(--text-primary) whitespace-pre-wrap">
											{getAnswer(p, eq.questionId)}
										</p>
									</div>
								</div>
							{/each}

							<div class="flex justify-end">
								<Button
									type="submit"
									loading={submitting}
									disabled={submitting || mcPct + essayPct !== 100}
								>
									{submitting ? 'Menyimpan...' : 'Simpan & Hitung Nilai'}
								</Button>
							</div>
						</form>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
