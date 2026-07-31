<script lang="ts">
	import { Icon, Button } from "$lib/components/atoms";
	import { Pagination } from "$lib/components/molecules";
	import { apiClient } from "$lib/utils/api";
	import { getAttachmentUrl } from "$lib/utils/helpers";
	import { onMount, untrack } from "svelte";
	import { page } from "$app/stores";

	let studentId = $derived($page.data.profileData?.studentId || "");
	let placements = $state<any[]>([]);
	let loading = $state(true);
	let currentPage = $state(1);
	let totalPages = $state(1);

	// Expanded state for indicator details
	let expandedPlacementId = $state<string | null>(null);
	let indicatorDetails = $state<Record<string, any[]>>({});
	let loadingDetails = $state<Record<string, boolean>>({});

	async function fetchPlacements(pageNo = 1) {
		loading = true;
		if (studentId) {
			const res = await apiClient(
				`/internship-placements?studentId=${studentId}&page=${pageNo}&limit=10`,
			);
			if (res && !res.error) {
				placements = res.data || [];
				totalPages = res.pagination?.totalPage || 1;
				currentPage = res.pagination?.currentPage || 1;
			}
		}
		loading = false;
	}

	async function toggleDetails(placementId: string) {
		if (expandedPlacementId === placementId) {
			expandedPlacementId = null;
			return;
		}
		expandedPlacementId = placementId;
		if (!indicatorDetails[placementId]) {
			await fetchIndicatorDetails(placementId);
		}
	}

	async function fetchIndicatorDetails(placementId: string) {
		loadingDetails = { ...loadingDetails, [placementId]: true };
		const res = await apiClient(`/assessment-scores?placementId=${placementId}`);
		if (res && !res.error) {
			indicatorDetails = { ...indicatorDetails, [placementId]: res.data || [] };
		} else {
			indicatorDetails = { ...indicatorDetails, [placementId]: [] };
		}
		loadingDetails = { ...loadingDetails, [placementId]: false };
	}

	onMount(() => {
		if (studentId) fetchPlacements(currentPage);
	});

	$effect(() => {
		if (studentId) {
			untrack(() => fetchPlacements(currentPage));
		}
	});

	function getGradeDetails(assessments: any[]) {
		if (!assessments)
			return {
				hasBoth: false,
				finalScore: null,
				teacherScore: null,
				mentorScore: null,
				certAttachment: null,
			};

		const mentorAssessment = assessments.find(
			(a: any) => a.assessorType === "industry_mentor",
		);
		const teacherAssessment = assessments.find(
			(a: any) => a.assessorType === "teacher",
		);

		const hasBoth = !!(mentorAssessment && teacherAssessment);

		// Use teacherScore/mentorScore fields (auto-calculated from indicators)
		const teacherScore = teacherAssessment?.teacherScore != null
			? parseFloat(teacherAssessment.teacherScore)
			: (teacherAssessment?.finalScore != null ? parseFloat(teacherAssessment.finalScore) : null);
		const mentorScore = mentorAssessment?.mentorScore != null
			? parseFloat(mentorAssessment.mentorScore)
			: (mentorAssessment?.finalScore != null ? parseFloat(mentorAssessment.finalScore) : null);

		let finalScore = null;
		if (teacherScore !== null && mentorScore !== null) {
			finalScore = (teacherScore + mentorScore) / 2;
		} else if (teacherScore !== null) {
			finalScore = teacherScore;
		} else if (mentorScore !== null) {
			finalScore = mentorScore;
		}

		let certAttachment =
			mentorAssessment?.attachment ||
			teacherAssessment?.attachment ||
			null;

		return { hasBoth, finalScore, teacherScore, mentorScore, certAttachment };
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return "-";
		return new Intl.DateTimeFormat("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
		}).format(new Date(dateStr));
	}

	function getCertUrl(attachment: any) {
		if (!attachment || !attachment.url) return null;
		return getAttachmentUrl(attachment.url);
	}

	function groupScoresByIndicator(scores: any[]) {
		const grouped: Record<string, any> = {};
		for (const score of scores) {
			const indicatorId = score.indicatorId;
			if (!grouped[indicatorId]) {
				grouped[indicatorId] = {
					description: score.indicator?.description || "Indikator",
					order: score.indicator?.order || 0,
					teacherScore: null,
					mentorScore: null,
				};
			}
			if (score.assessorType === "teacher") {
				grouped[indicatorId].teacherScore = Number(score.score);
			} else if (score.assessorType === "industry_mentor") {
				grouped[indicatorId].mentorScore = Number(score.score);
			}
		}
		return Object.values(grouped).sort((a: any, b: any) => a.order - b.order);
	}

	function calculateIndicatorAverage(ind: any) {
		if (ind.teacherScore !== null && ind.mentorScore !== null) {
			return Math.round(((ind.teacherScore + ind.mentorScore) / 2) * 100) / 100;
		}
		return ind.teacherScore ?? ind.mentorScore ?? null;
	}
</script>

<svelte:head>
	<title>Nilai & Sertifikat | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up">
	<h2 class="font-headline text-xl font-black uppercase tracking-tight">
		Nilai & Sertifikat
	</h2>
	<p class="font-mono text-secondary text-[10px] mt-1">
		Hasil evaluasi dan sertifikat dari seluruh kegiatan magang Anda.
	</p>
</div>

<div class="grid grid-cols-1 gap-4">
	{#if loading}
		<div class="flex items-center justify-center min-h-[300px]">
			<Icon name="sync" class="text-lg animate-spin text-primary" />
		</div>
	{:else if placements.length === 0}
		<div
			class="border-2 border-on-background bg-surface shadow-neo-sm p-5 text-center animate-fade-in-up"
		>
			<p class="font-mono text-secondary">
				Anda belum terdaftar pada penempatan magang manapun.
			</p>
		</div>
	{:else}
		{#each placements as placement, index}
			{@const details = getGradeDetails(placement.assessments || [])}
			{@const isCompleted = placement.status === "completed"}
			{@const certUrl = getCertUrl(details.certAttachment)}
			{@const isExpanded = expandedPlacementId === placement.id}

			{#if isCompleted || details.finalScore !== null}
				<!-- Completed / Has Grade -->
				<div
					class="border-2 border-on-background bg-surface shadow-neo-sm animate-fade-in-up flex flex-col"
					style="animation-delay: {0.1 *
						(index + 1)}s; animation-fill-mode: both;"
				>
					<!-- Header row -->
					<div class="flex flex-col md:flex-row">
						<div
							class="p-4 md:w-1/3 border-b-2 md:border-b-0 md:border-r-2 border-on-background bg-slate-50 flex flex-col items-center justify-center text-center"
						>
							<div
								class="w-10 h-10 bg-primary border-2 border-on-background shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-center text-white mb-2"
							>
								<Icon name="verified" class="text-xl" />
							</div>
							<h3
								class="font-headline font-bold text-sm text-on-background uppercase tracking-tight"
							>
								{placement.company?.name || "Perusahaan"}
							</h3>
							<span
								class="font-mono text-[9px] text-secondary font-bold"
							>
								{formatDate(placement.startDate)} - {formatDate(
									placement.endDate,
								)}
							</span>
						</div>

						<div
							class="p-4 md:w-2/3 flex flex-col justify-between gap-3"
						>
							<div class="grid grid-cols-3 gap-2">
								<div
									class="p-2.5 bg-surface border-2 border-on-background shadow-[2px_2px_0px_0px_#0f172a] text-center"
								>
									<span
										class="text-xs font-bold font-mono text-secondary uppercase tracking-wider block"
									>
										Nilai Guru
									</span>
									<span
										class="font-mono font-black text-base md:text-lg text-on-background mt-0.5 block"
									>
										{details.teacherScore !== null
											? details.teacherScore.toFixed(1)
											: "-"}
									</span>
								</div>

								<div
									class="p-2.5 bg-surface border-2 border-on-background shadow-[2px_2px_0px_0px_#0f172a] text-center"
								>
									<span
										class="text-xs font-bold font-mono text-secondary uppercase tracking-wider block"
									>
										Nilai Mentor
									</span>
									<span
										class="font-mono font-black text-base md:text-lg text-on-background mt-0.5 block"
									>
										{details.mentorScore !== null
											? details.mentorScore.toFixed(1)
											: "-"}
									</span>
								</div>

								<div
									class="p-2.5 bg-primary border-2 border-on-background shadow-[2px_2px_0px_0px_#0f172a] text-center text-white"
								>
									<span
										class="text-xs font-bold font-mono uppercase tracking-wider block opacity-90"
									>
										Nilai Akhir
									</span>
									<span class="font-mono font-black text-base md:text-lg mt-0.5 block">
										{details.finalScore !== null
											? details.finalScore.toFixed(1)
											: "-"}
									</span>
								</div>
							</div>

							<div class="flex justify-end items-center gap-2">
								{#if certUrl}
									<a
										href={certUrl}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Button variant="primary" size="sm">
											<Icon name="download" class="text-xs" />
											<span>Unduh Sertifikat</span>
										</Button>
									</a>
								{/if}
								<Button
									variant="secondary"
									size="sm"
									onclick={() => toggleDetails(placement.id)}
								>
									<Icon name={isExpanded ? "expand_less" : "expand_more"} class="text-xs" />
									<span>{isExpanded ? "Tutup Rincian" : "Lihat Rincian"}</span>
								</Button>
							</div>
						</div>
					</div>

					<!-- Expanded indicator details -->
					{#if isExpanded}
						<div class="border-t-2 border-on-background p-4 bg-slate-50 animate-fade-in-up">
							<h4 class="font-headline font-black text-xs uppercase tracking-tight mb-3">
								Rincian Nilai Per Indikator
							</h4>
							{#if loadingDetails[placement.id]}
								<div class="flex items-center justify-center p-4">
									<Icon name="sync" class="text-sm animate-spin text-primary" />
								</div>
							{:else if indicatorDetails[placement.id]?.length === 0}
								<p class="font-mono text-[10px] text-secondary text-center p-3">
									Belum ada data penilaian per indikator.
								</p>
							{:else}
								{@const groupedScores = groupScoresByIndicator(indicatorDetails[placement.id] || [])}
								<div class="overflow-x-auto">
									<table class="w-full border-2 border-on-background">
										<thead>
											<tr class="bg-primary text-white">
												<th class="border-2 border-on-background px-3 py-2 text-left font-mono text-[10px] uppercase">#</th>
												<th class="border-2 border-on-background px-3 py-2 text-left font-mono text-[10px] uppercase">Indikator</th>
												<th class="border-2 border-on-background px-3 py-2 text-center font-mono text-[10px] uppercase">Nilai Guru</th>
												<th class="border-2 border-on-background px-3 py-2 text-center font-mono text-[10px] uppercase">Nilai Mentor</th>
												<th class="border-2 border-on-background px-3 py-2 text-center font-mono text-[10px] uppercase">Rata-rata</th>
											</tr>
										</thead>
										<tbody>
											{#each groupedScores as ind, idx}
												{@const avg = calculateIndicatorAverage(ind)}
												<tr class="hover:bg-white transition-colors">
													<td class="border-2 border-on-background px-3 py-2 font-mono text-[10px] font-bold text-primary">{idx + 1}</td>
													<td class="border-2 border-on-background px-3 py-2 font-mono text-[10px]">{ind.description}</td>
													<td class="border-2 border-on-background px-3 py-2 text-center font-mono text-[10px] font-bold">
														{ind.teacherScore !== null ? ind.teacherScore : "-"}
													</td>
													<td class="border-2 border-on-background px-3 py-2 text-center font-mono text-[10px] font-bold">
														{ind.mentorScore !== null ? ind.mentorScore : "-"}
													</td>
													<td class="border-2 border-on-background px-3 py-2 text-center font-mono text-[10px] font-bold text-primary">
														{avg !== null ? avg : "-"}
													</td>
												</tr>
											{/each}
										</tbody>
										<tfoot>
											<tr class="bg-primary text-white">
												<td colspan="4" class="border-2 border-on-background px-3 py-2 font-mono text-[10px] font-black uppercase text-right">Nilai Total</td>
												<td class="border-2 border-on-background px-3 py-2 text-center font-mono text-xs font-black">
													{details.finalScore !== null ? details.finalScore.toFixed(1) : "-"}
												</td>
											</tr>
										</tfoot>
									</table>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<!-- In Progress / Not Evaluated Yet -->
				<div
					class="border-2 border-on-background bg-surface shadow-neo-sm p-4 animate-fade-in-up flex flex-col md:flex-row items-center justify-between gap-3"
					style="animation-delay: {0.1 *
						(index + 1)}s; animation-fill-mode: both;"
				>
					<div>
						<h3
							class="font-headline font-bold text-sm text-on-background uppercase tracking-tight"
						>
							{placement.company?.name || "Perusahaan"}
						</h3>
						<span
							class="font-mono text-[9px] text-secondary font-bold block"
						>
							{formatDate(placement.startDate)} - {formatDate(
								placement.endDate,
							)}
						</span>
					</div>
					<span class="font-mono text-[10px] text-secondary italic">
						Penilaian masih berlangsung
					</span>
				</div>
			{/if}
		{/each}
	{/if}
</div>

{#if !loading && totalPages > 1}
	<div class="mt-4 flex justify-end">
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}
