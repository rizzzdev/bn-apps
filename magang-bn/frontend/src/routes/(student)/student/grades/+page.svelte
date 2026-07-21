<script lang="ts">
	import { Icon, Button } from '$lib/components/atoms';
	import { Pagination } from '$lib/components/molecules';
	import { apiClient } from '$lib/utils/api';
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/stores';
	import { PUBLIC_API_URL } from '$env/static/public';

	let studentId = $derived($page.data.profileData?.studentId || '');
	let placements = $state<any[]>([]);
	let loading = $state(true);
	let currentPage = $state(1);
	let totalPages = $state(1);

	async function fetchPlacements(pageNo = 1) {
		loading = true;
		if (studentId) {
			const res = await apiClient(`/api/v1/internship-placements?studentId=${studentId}&page=${pageNo}&limit=10`);
			if (res && !res.error) {
				placements = res.data || [];
				totalPages = res.pagination?.totalPage || 1;
				currentPage = res.pagination?.currentPage || 1;
			}
		}
		loading = false;
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
		if (!assessments) return { hasBoth: false, finalScore: null, technical: '-', nonTechnical: '-', certAttachment: null };
		
		const mentorAssessment = assessments.find((a: any) => a.assessorType === 'industry_mentor');
		const teacherAssessment = assessments.find((a: any) => a.assessorType === 'teacher');
		
		const hasBoth = !!(mentorAssessment && teacherAssessment);
		
		// Skor akhir berasal dari rata-rata kedua nilai
		let finalScore = null;
		if (hasBoth && mentorAssessment.finalScore != null && teacherAssessment.finalScore != null) {
			finalScore = (parseFloat(mentorAssessment.finalScore) + parseFloat(teacherAssessment.finalScore)) / 2;
		}

		let technical = '-';
		if (mentorAssessment?.technicalScore != null) technical = parseFloat(mentorAssessment.technicalScore).toString();
		else if (mentorAssessment?.finalScore != null) technical = parseFloat(mentorAssessment.finalScore).toString();

		let nonTechnical = '-';
		if (teacherAssessment?.nonTechnicalScore != null) nonTechnical = parseFloat(teacherAssessment.nonTechnicalScore).toString();
		else if (teacherAssessment?.finalScore != null) nonTechnical = parseFloat(teacherAssessment.finalScore).toString();

		// Cek apakah sudah ada sertifikat di relasi database assessment
		let certAttachment = mentorAssessment?.attachment || teacherAssessment?.attachment || null;
		
		return { hasBoth, finalScore, technical, nonTechnical, certAttachment };
	}
	
	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));
	}

	function getCertUrl(attachment: any) {
		if (!attachment || !attachment.url) return null;
		// Pastikan tidak ada double slash jika attachment.url sudah diawali slash
		const urlPath = attachment.url.startsWith('/') ? attachment.url : `/${attachment.url}`;
		return `${PUBLIC_API_URL}${urlPath}`;
	}
</script>

<svelte:head>
	<title>Nilai & Sertifikat | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up">
	<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Nilai & Sertifikat</h2>
	<p class="font-mono text-secondary mt-1">Hasil evaluasi dan sertifikat dari seluruh kegiatan magang Anda.</p>
</div>

<div class="grid grid-cols-1 gap-8">
	{#if loading}
		<div class="flex items-center justify-center min-h-[300px]">
			<Icon name="sync" class="text-5xl animate-spin text-primary" />
		</div>
	{:else if placements.length === 0}
		<div class="border-4 border-on-background bg-surface shadow-neo p-8 text-center animate-fade-in-up">
			<p class="font-mono text-secondary">Anda belum terdaftar pada penempatan magang manapun.</p>
		</div>
	{:else}
		{#each placements as placement, index}
			{@const details = getGradeDetails(placement.assessments || [])}
			{@const isCompleted = placement.status === 'completed'}
			{@const certUrl = getCertUrl(details.certAttachment)}

			{#if isCompleted || details.finalScore !== null}
				<!-- Completed / Has Grade -->
				<div class="border-4 border-on-background bg-surface shadow-neo animate-fade-in-up flex flex-col md:flex-row" style="animation-delay: {0.1 * (index + 1)}s; animation-fill-mode: both;">
					<div class="p-6 md:w-1/3 border-b-4 md:border-b-0 md:border-r-4 border-on-background bg-slate-50 flex flex-col items-center justify-center text-center">
						<div class="w-24 h-24 rounded-full border-4 border-on-background {details.finalScore !== null ? 'bg-success' : 'bg-warning'} text-on-background flex flex-col items-center justify-center mb-4 drop-shadow-[4px_4px_0px_#0f172a]">
							<span class="font-headline font-black text-3xl">{details.finalScore !== null ? Math.round(details.finalScore) : '-'}</span>
							<span class="font-mono text-[10px] font-bold uppercase mt-1">Skor Akhir</span>
						</div>
						{#if details.hasBoth && certUrl}
							<Button variant="primary" class="w-full" href={certUrl} target="_blank">
								<Icon name="download" class="mr-2" /> Unduh Sertifikat
							</Button>
						{:else}
							<Button variant="secondary" class="w-full" disabled>
								Sertifikat Belum Tersedia
							</Button>
						{/if}
					</div>
					<div class="p-6 md:w-2/3 flex flex-col justify-center">
						<div class="mb-4">
							<span class="bg-success text-on-background border-2 border-on-background px-2 py-1 text-xs font-bold uppercase mb-2 inline-block">Selesai</span>
							<h3 class="font-headline font-black text-2xl uppercase tracking-tight">{placement.company?.name || 'Perusahaan Tidak Diketahui'}</h3>
							<p class="font-mono text-sm text-secondary">Periode: {formatDate(placement.startDate)} - {formatDate(placement.endDate)}</p>
						</div>
						<div class="grid grid-cols-2 gap-4 border-t-2 border-dashed border-gray-300 pt-4">
							<div class="border-2 border-on-background p-3 bg-white">
								<p class="font-bold text-lg">{details.technical}</p>
								<p class="font-mono text-xs uppercase">Nilai Mentor</p>
							</div>
							<div class="border-2 border-on-background p-3 bg-white">
								<p class="font-bold text-lg">{details.nonTechnical}</p>
								<p class="font-mono text-xs uppercase">Nilai Guru</p>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- Ongoing / No Grade Yet -->
				<div class="border-4 border-on-background bg-surface shadow-neo animate-fade-in-up flex flex-col md:flex-row opacity-80" style="animation-delay: {0.1 * (index + 1)}s; animation-fill-mode: both;">
					<div class="p-6 md:w-1/3 border-b-4 md:border-b-0 md:border-r-4 border-on-background bg-slate-50 flex flex-col items-center justify-center text-center">
						<div class="w-24 h-24 rounded-full border-4 border-on-background bg-warning flex items-center justify-center mb-4 drop-shadow-[4px_4px_0px_#0f172a]">
							<Icon name="lock" class="text-4xl" />
						</div>
						<Button variant="secondary" class="w-full" disabled>
							Sertifikat Terkunci
						</Button>
					</div>
					<div class="p-6 md:w-2/3 flex flex-col justify-center">
						<div class="mb-4">
							<span class="{placement.status === 'active' ? 'bg-warning' : 'bg-surface'} text-on-background border-2 border-on-background px-2 py-1 text-xs font-bold uppercase mb-2 inline-block">
								{placement.status === 'active' ? 'Aktif / Berjalan' : placement.status}
							</span>
							<h3 class="font-headline font-black text-2xl uppercase tracking-tight">{placement.company?.name || 'Perusahaan Tidak Diketahui'}</h3>
							<p class="font-mono text-sm text-secondary">Periode: {formatDate(placement.startDate)} - {formatDate(placement.endDate)}</p>
						</div>
						
						<div class="grid grid-cols-2 gap-4 border-t-2 border-dashed border-gray-300 pt-4 mt-auto">
							<div class="border-2 border-on-background p-3 bg-white opacity-50">
								<p class="font-bold text-lg">{details.technical}</p>
								<p class="font-mono text-xs uppercase">Nilai Mentor</p>
							</div>
							<div class="border-2 border-on-background p-3 bg-white opacity-50">
								<p class="font-bold text-lg">{details.nonTechnical}</p>
								<p class="font-mono text-xs uppercase">Nilai Guru</p>
							</div>
						</div>
					</div>
				</div>
			{/if}
		{/each}
	{/if}
</div>

{#if !loading && totalPages > 1}
	<div class="mt-6 flex justify-end animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}
