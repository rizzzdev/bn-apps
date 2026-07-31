<script lang="ts">
	import { Icon, Button } from '$lib/components/atoms';
	import { apiClient } from '$lib/utils/api';

	let {
		show = $bindable(false),
		title = 'Input Nilai',
		placementId = '',
		assessorType = 'teacher',
		assessorId = '',
		onsubmit = () => {},
	} = $props<{
		show?: boolean;
		title?: string;
		placementId?: string;
		assessorType?: string;
		assessorId?: string;
		onsubmit?: () => void;
	}>();

	let indicators = $state<any[]>([]);
	let scores = $state<Record<string, number>>({});
	let notes = $state('');
	let loading = $state(false);
	let isSubmitting = $state(false);
	let error = $state('');

	let averageScore = $derived.by(() => {
		const values = Object.values(scores).filter(v => v !== null && v !== undefined);
		if (values.length === 0) return 0;
		return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
	});

	let allScoresFilled = $derived.by(() => {
		return indicators.length > 0 && indicators.every(ind => scores[ind.id] !== undefined && scores[ind.id] !== null);
	});

	$effect(() => {
		if (show && placementId) {
			fetchIndicators();
		}
	});

	async function fetchIndicators() {
		loading = true;
		error = '';
		scores = {};
		const res = await apiClient(`/assessment-indicators?placementId=${placementId}`);
		if (res && !res.error) {
			indicators = res.data || [];
			// Initialize scores with existing values if available
			for (const ind of indicators) {
				const existingScore = ind.scores?.find((s: any) => s.assessorType === assessorType);
				if (existingScore) {
					scores[ind.id] = Number(existingScore.score);
				}
			}
		} else {
			indicators = [];
			error = res?.message || 'Gagal mengambil data indikator';
		}
		loading = false;
	}

	function setScore(indicatorId: string, value: number) {
		scores[indicatorId] = value;
	}

	async function handleSubmit() {
		if (!allScoresFilled) return;
		isSubmitting = true;
		try {
			// Bulk submit scores
			const scoreArray = indicators.map(ind => ({
				indicatorId: ind.id,
				score: scores[ind.id] || 0,
			}));

			const res = await apiClient('/assessment-scores/bulk', {
				method: 'POST',
				body: JSON.stringify({
					placementId,
					assessorType,
					assessorId,
					scores: scoreArray,
				}),
			});

			if (res && !res.error) {
				await onsubmit();
			} else {
				error = res?.message || 'Gagal menyimpan penilaian';
			}
		} catch (e) {
			error = 'Terjadi kesalahan saat menyimpan';
		}
		isSubmitting = false;
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/50 backdrop-blur-sm">
		<div class="bg-surface border-2 border-on-background shadow-[6px_6px_0px_0px_#0f172a] w-full max-w-lg animate-scale-in">
			<div class="border-b-2 border-on-background p-3 flex justify-between items-center bg-primary text-on-background">
				<h3 class="font-headline font-black text-sm uppercase">{title}</h3>
				<button onclick={() => show = false} class="hover:bg-on-background/20 p-0.5 rounded transition-colors">
					<Icon name="close" class="text-sm" />
				</button>
			</div>
			<div class="p-4">
				{#if loading}
					<div class="flex items-center justify-center p-8">
						<Icon name="sync" class="text-lg animate-spin text-primary" />
						<span class="ml-2 font-mono text-[10px]">Memuat indikator...</span>
					</div>
				{:else if error}
					<div class="p-4 text-center">
						<p class="font-mono text-[10px] text-error">{error}</p>
						<Button variant="secondary" size="sm" class="mt-2" onclick={fetchIndicators}>Coba Lagi</Button>
					</div>
				{:else if indicators.length === 0}
					<div class="p-4 text-center">
						<p class="font-mono text-[10px] text-secondary">Belum ada indikator keberhasilan.</p>
						<p class="font-mono text-[9px] text-secondary mt-1">Hubungi admin untuk menambahkan indikator.</p>
					</div>
				{:else}
					<p class="font-mono text-[10px] text-secondary mb-3">
						Berikan nilai untuk setiap indikator keberhasilan (0-100):
					</p>

					<div class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
						{#each indicators as indicator, idx}
							<div class="border-2 border-on-background p-3 bg-slate-50">
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1">
										<span class="font-mono text-[10px] font-bold text-primary">#{idx + 1}</span>
										<p class="font-mono text-[11px] text-on-background mt-0.5">{indicator.description}</p>
									</div>
									<div class="shrink-0 w-20">
										<input
											type="number"
											min="0"
											max="100"
											value={scores[indicator.id] ?? ''}
											oninput={(e) => {
												const val = parseInt((e.target as HTMLInputElement).value);
												setScore(indicator.id, isNaN(val) ? 0 : val);
											}}
											class="w-full border-2 border-on-background bg-surface p-1.5 font-mono text-[11px] text-center text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-neo-sm"
											placeholder="0"
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Average Score Display -->
					<div class="mt-4 border-2 border-on-background bg-primary text-on-background p-3 flex items-center justify-between">
						<span class="font-headline font-black text-xs uppercase">Rata-rata Nilai</span>
						<span class="font-mono font-black text-lg">{averageScore}</span>
					</div>

					<!-- Notes -->
					<div class="mt-3">
						<label for="notesInput" class="block font-bold text-[10px] uppercase mb-1">Catatan Evaluasi</label>
						<textarea
							id="notesInput"
							bind:value={notes}
							rows="2"
							class="w-full border-2 border-on-background bg-surface p-2 font-mono text-[10px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-neo-sm"
						></textarea>
					</div>

					<div class="flex gap-3 mt-4">
						<Button variant="secondary" class="flex-1" onclick={() => show = false}>Batal</Button>
						<Button
							variant="primary"
							class="flex-1"
							onclick={handleSubmit}
							disabled={isSubmitting || !allScoresFilled}
						>
							{isSubmitting ? 'Menyimpan...' : 'Simpan Nilai'}
						</Button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
