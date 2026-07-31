<script lang="ts">
	import { Icon, ActionButton, Badge, Button } from "$lib/components/atoms";
	import { Table, Th, Td, Tr, Modal } from "$lib/components/molecules";
	import Pagination from "./pagination.svelte";
	import SearchFilter from "./search-filter.svelte";
	import Select from "./select.svelte";
	import { getAttachmentUrl } from "$lib/utils/helpers";
	import { apiClient } from "$lib/utils/api";
	import { toast } from "$lib/stores/toast.svelte";
	import type { InternshipPlacement } from "$lib/types";

	function escapeHtml(str: string): string {
		if (!str) return '';
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
	}

	type SelectOption = { value: string; label: string };

	let {
		participants = [],
		loading = false,
		totalPages = 1,
		currentPage = $bindable(1),
		searchQuery = $bindable(""),
		onSearch,
		studentOptions = [],
		selectedStudent = $bindable(""),
		statusOptions = [],
		selectedStatus = $bindable(""),
		companyOptions,
		selectedCompany = $bindable(""),
		variant = "admin",
		onAssess,
		onUploadCertificate,
		onDeleteCertificate,
	}: {
		participants: InternshipPlacement[];
		loading: boolean;
		totalPages: number;
		currentPage: number;
		searchQuery: string;
		onSearch: () => void;
		studentOptions: SelectOption[];
		selectedStudent: string;
		statusOptions: SelectOption[];
		selectedStatus: string;
		companyOptions?: SelectOption[];
		selectedCompany?: string;
		variant: "admin" | "teacher" | "mentor";
		onAssess?: (p: InternshipPlacement) => void;
		onUploadCertificate?: (p: InternshipPlacement) => void;
		onDeleteCertificate?: (p: InternshipPlacement) => void;
	} = $props();

	// Detail modal state
	let showDetailModal = $state(false);
	let selectedPlacement = $state<any>(null);
	let indicatorDetails = $state<any[]>([]);
	let loadingDetails = $state(false);
	let activeTab = $state<'teacher' | 'mentor'>('teacher');

	function getScore(p: any, type: string) {
		const assessment = p.assessments?.find(
			(a: any) => a.assessorType === type,
		);
		if (!assessment) return null;
		// Use teacherScore/mentorScore fields (auto-calculated from indicators)
		if (type === "teacher") {
			return assessment.teacherScore != null ? Number(assessment.teacherScore) : (assessment.finalScore != null ? Number(assessment.finalScore) : null);
		}
		if (type === "industry_mentor") {
			return assessment.mentorScore != null ? Number(assessment.mentorScore) : (assessment.finalScore != null ? Number(assessment.finalScore) : null);
		}
		return assessment.finalScore != null ? Number(assessment.finalScore) : null;
	}

	function getMentorAssessment(p: any) {
		return p.assessments?.find(
			(a: any) => a.assessorType === "industry_mentor",
		);
	}

	function getTotalScore(p: any) {
		const mentorScore = getScore(p, "industry_mentor");
		const teacherScore = getScore(p, "teacher");
		if (mentorScore !== null && teacherScore !== null) {
			return Math.round((mentorScore + teacherScore) / 2);
		}
		// If only one assessor has scored, show that score as total
		if (mentorScore !== null) return Math.round(mentorScore);
		if (teacherScore !== null) return Math.round(teacherScore);
		return null;
	}

	// Who can assess based on variant
	let hasAssessed = $derived.by(() => (p: any) => {
		if (variant === "teacher") return getScore(p, "teacher") !== null;
		if (variant === "mentor")
			return getScore(p, "industry_mentor") !== null;
		return true;
	});

	// Column count depends on whether company column is shown
	let colCount = $derived(companyOptions ? 6 : 5);

	// Open detail modal
	async function openDetailModal(p: any) {
		selectedPlacement = p;
		activeTab = 'teacher';
		showDetailModal = true;
		await fetchIndicatorDetails(p.id);
	}

	// Fetch indicator scores for a placement
	async function fetchIndicatorDetails(placementId: string) {
		loadingDetails = true;
		const res = await apiClient(`/assessment-scores?placementId=${placementId}`);
		if (res && !res.error) {
			indicatorDetails = res.data || [];
		} else {
			indicatorDetails = [];
		}
		loadingDetails = false;
	}

	// Group scores by indicator description
	function groupScoresByIndicator(scores: any[]) {
		const grouped: Record<string, any> = {};
		for (const score of scores) {
			const key = score.indicator?.description || score.indicatorId;
			if (!grouped[key]) {
				grouped[key] = {
					description: score.indicator?.description || "Indikator",
					order: score.indicator?.order || 0,
					teacherScore: null,
					mentorScore: null,
				};
			}
			if (score.assessorType === "teacher") {
				grouped[key].teacherScore = Number(score.score);
			} else if (score.assessorType === "industry_mentor") {
				grouped[key].mentorScore = Number(score.score);
			}
		}
		return Object.values(grouped).sort((a: any, b: any) => a.order - b.order);
	}

	// Calculate average for a single indicator
	function calcAvg(ind: any) {
		if (ind.teacherScore !== null && ind.mentorScore !== null) {
			return Math.round(((ind.teacherScore + ind.mentorScore) / 2) * 100) / 100;
		}
		return ind.teacherScore ?? ind.mentorScore ?? null;
	}

	// Open certificate in new tab with about:blank
	async function openCertificate(p: any) {
		// Fetch indicator scores
		const res = await apiClient(`/assessment-scores?placementId=${p.id}`);
		const scores = (res && !res.error) ? (res.data || []) : [];
		
		// Group scores by indicator
		const grouped: Record<string, any> = {};
		for (const score of scores) {
			const key = score.indicator?.description || score.indicatorId;
			if (!grouped[key]) {
				grouped[key] = {
					description: score.indicator?.description || "Indikator",
					order: score.indicator?.order || 0,
					teacherScore: null,
					mentorScore: null,
				};
			}
			if (score.assessorType === "teacher") {
				grouped[key].teacherScore = Number(score.score);
			} else if (score.assessorType === "industry_mentor") {
				grouped[key].mentorScore = Number(score.score);
			}
		}
		const indicators = Object.values(grouped).sort((a: any, b: any) => a.order - b.order);
		
		const studentName = escapeHtml(p.student?.name || '-');
		const companyName = escapeHtml(p.company?.name || '-');
		const teacherName = escapeHtml(p.teacher?.name || '-');
		const mentorName = escapeHtml(p.industryMentor?.name || '-');
		const teacherPrefix = escapeHtml(p.teacher?.prefixTitle || '');
		const teacherSuffix = escapeHtml(p.teacher?.suffixTitle || '');
		const mentorPrefix = escapeHtml(p.industryMentor?.prefixTitle || '');
		const mentorSuffix = escapeHtml(p.industryMentor?.suffixTitle || '');
		const startDate = new Date(p.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
		const endDate = new Date(p.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
		const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
		const teacherScore = getScore(p, 'teacher');
		const mentorScore = getScore(p, 'industry_mentor');
		const totalScore = getTotalScore(p);

		// Build indicator rows
		let indicatorRows = '';
		indicators.forEach((ind: any, idx: number) => {
			indicatorRows += `
				<tr>
					<td class="col-no">${idx + 1}</td>
					<td class="col-indicator">${escapeHtml(ind.description)}</td>
					<td class="col-score">${ind.teacherScore ?? '-'}</td>
					<td class="col-score">${ind.mentorScore ?? '-'}</td>
					<td class="col-score">${calcAvg(ind) ?? '-'}</td>
				</tr>`;
		});

		const html = `<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Surat Keterangan - ${studentName}</title>
	<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
	<style>
		@page {
			size: A4;
			margin: 20mm 22mm 20mm 22mm;
		}
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: 'EB Garamond', 'Georgia', serif;
			color: #2c1810;
			line-height: 1.65;
			background: white;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
		@media print {
			body { background: white; }
			.no-print { display: none !important; }
			.frame-border { border-color: #8b7355 !important; }
			.frame-inner { border-color: #8b7355 !important; }
			.header-rule { background: #8b7355 !important; }
			.header-rule-thin { background: #8b7355 !important; }
			.title-rule { background: #8b7355 !important; }
			.detail-box { background: #faf8f5 !important; border-color: #d4c5a9 !important; }
			.score-table thead th { background: #3d2b1f !important; color: #f5f0e8 !important; }
			.score-table tbody tr:nth-child(even) { background: #faf8f5 !important; }
			.score-table tfoot td { background: #f0ebe3 !important; }
			.ornament { color: #8b7355 !important; }
		}

		/* === FRAME === */
		.frame-border {
			border: 2px solid #8b7355;
			padding: 6px;
		}
		.frame-inner {
			border: 1px solid #b8a88a;
			padding: 32px 36px;
		}

		/* === LETTERHEAD === */
		.letterhead {
			text-align: center;
			margin-bottom: 6px;
		}
		.letterhead-school {
			font-family: 'Cormorant Garamond', serif;
			font-size: 22px;
			font-weight: 600;
			color: #3d2b1f;
			letter-spacing: 2px;
			text-transform: uppercase;
		}
		.letterhead-sub {
			font-size: 11px;
			color: #8b7355;
			letter-spacing: 3px;
			text-transform: uppercase;
			margin-top: 2px;
		}
		.header-rule {
			height: 2px;
			background: #8b7355;
			margin: 10px 40px 0;
		}
		.header-rule-thin {
			height: 1px;
			background: #b8a88a;
			margin: 3px 50px 0;
		}

		/* === ORNAMENT === */
		.ornament {
			text-align: center;
			color: #8b7355;
			font-size: 18px;
			margin: 16px 0;
			letter-spacing: 8px;
		}

		/* === TITLE === */
		.doc-title {
			text-align: center;
			margin: 8px 0 4px;
		}
		.doc-title h2 {
			font-family: 'Cormorant Garamond', serif;
			font-size: 20px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 4px;
			color: #3d2b1f;
		}
		.title-rule {
			height: 1px;
			background: #8b7355;
			margin: 8px auto;
			width: 120px;
		}
		.doc-subtitle {
			font-size: 12px;
			color: #8b7355;
			letter-spacing: 2px;
			text-transform: uppercase;
		}
		.doc-ref {
			display: flex;
			justify-content: space-between;
			font-size: 11px;
			color: #8b7355;
			margin: 10px 0 18px;
			font-style: italic;
		}

		/* === BODY === */
		.body-text {
			font-size: 13.5px;
			line-height: 1.8;
			text-align: justify;
			color: #3d2b1f;
		}
		.body-text p {
			margin-bottom: 10px;
			text-indent: 2em;
		}
		.body-text p:first-child {
			text-indent: 0;
		}
		.detail-box {
			background: #faf8f5;
			border: 1px solid #d4c5a9;
			padding: 14px 20px;
			margin: 12px 0 14px;
		}
		.detail-row {
			display: flex;
			gap: 6px;
			font-size: 13px;
			line-height: 1.8;
			color: #3d2b1f;
		}
		.detail-label {
			min-width: 130px;
			font-weight: 600;
			color: #5a4232;
		}

		/* === TABLE === */
		.score-section-title {
			font-family: 'Cormorant Garamond', serif;
			font-size: 14px;
			font-weight: 600;
			margin: 18px 0 10px;
			color: #3d2b1f;
			text-align: center;
			letter-spacing: 2px;
			text-transform: uppercase;
		}
		.score-table {
			width: 100%;
			border-collapse: collapse;
			margin: 0 0 18px;
			font-size: 12px;
			page-break-inside: avoid;
		}
		.score-table thead th {
			padding: 9px 10px;
			border: 1px solid #b8a88a;
			background: #3d2b1f;
			color: #f5f0e8;
			font-size: 10px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 1px;
			text-align: center;
			font-family: 'EB Garamond', serif;
		}
		.score-table tbody td {
			padding: 8px 10px;
			border: 1px solid #d4c5a9;
			font-size: 12.5px;
			color: #3d2b1f;
		}
		.score-table tbody tr:nth-child(even) {
			background: #faf8f5;
		}
		.score-table .col-no { text-align: center; width: 36px; color: #8b7355; }
		.score-table .col-indicator { text-align: left; }
		.score-table .col-score { text-align: center; width: 80px; font-weight: 600; }
		.score-table tfoot td {
			padding: 9px 10px;
			border: 1px solid #8b7355;
			font-weight: 700;
			font-size: 12px;
			background: #f0ebe3;
			color: #3d2b1f;
		}
		.score-table tfoot .total-label {
			text-align: right;
			text-transform: uppercase;
			letter-spacing: 1px;
			font-size: 10px;
		}
		.score-table tfoot .total-value { text-align: center; font-size: 13px; }
		.score-table tfoot .total-final { text-align: center; font-size: 15px; color: #3d2b1f; }

		/* === CLOSING === */
		.closing-text {
			font-size: 13.5px;
			line-height: 1.8;
			margin: 0 0 20px;
			color: #3d2b1f;
		}

		/* === SIGNATURES === */
		.signatures {
			display: flex;
			justify-content: space-between;
			padding: 0 16px;
			margin-top: 28px;
			page-break-inside: avoid;
		}
		.sig-block {
			text-align: center;
			width: 200px;
		}
		.sig-block .sig-label {
			font-size: 11px;
			color: #5a4232;
			margin-bottom: 2px;
			font-style: italic;
		}
		.sig-block .sig-space {
			height: 52px;
		}
		.sig-block .sig-line {
			width: 140px;
			height: 1px;
			background: #5a4232;
			margin: 0 auto 6px;
		}
		.sig-block .sig-name {
			font-size: 12px;
			font-weight: 700;
			color: #3d2b1f;
		}
		.sig-block .sig-title {
			font-size: 10px;
			color: #8b7355;
			letter-spacing: 0.5px;
		}
		.sig-block .sig-date {
			font-size: 10px;
			color: #b8a88a;
			margin-top: 2px;
			font-style: italic;
		}

		/* === PRINT BUTTON === */
		.print-btn {
			position: fixed;
			bottom: 24px;
			right: 24px;
			background: #3d2b1f;
			color: #f5f0e8;
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 20px;
			border: 1px solid #8b7355;
			font-family: 'EB Garamond', serif;
			font-size: 13px;
			font-weight: 600;
			cursor: pointer;
			letter-spacing: 1px;
			transition: all 0.2s;
		}
		.print-btn:hover { background: #5a4232; }
	</style>
</head>
<body>
	<div class="no-print print-btn" onclick="window.print()">Cetak Surat</div>

	<div class="frame-border">
	<div class="frame-inner">

	<!-- LETTERHEAD -->
	<div class="letterhead">
		<div class="letterhead-school">SMK Bina Nusantara</div>
		<div class="letterhead-sub">Program Magang Industri</div>
	</div>
	<div class="header-rule"></div>
	<div class="header-rule-thin"></div>

	<!-- ORNAMENT -->
	<div class="ornament">&#9670; &#9670; &#9670;</div>

	<!-- DOCUMENT TITLE -->
	<div class="doc-title">
		<h2>Surat Keterangan</h2>
		<div class="title-rule"></div>
		<div class="doc-subtitle">Penyelesaian Program Magang Industri</div>
	</div>
	<div class="doc-ref"><span>Nomor: .../.../${new Date().getFullYear()}</span><span>${today}</span></div>

	<!-- BODY -->
	<div class="body-text">
		<p>Yang bertanda tangan di bawah ini, menerangkan dengan sesungguhnya bahwa:</p>
	</div>

	<div class="detail-box">
		<div class="detail-row"><span class="detail-label">Nama Peserta</span><span>: ${studentName}</span></div>
		<div class="detail-row"><span class="detail-label">Mitra Industri</span><span>: ${companyName}</span></div>
		<div class="detail-row"><span class="detail-label">Periode Magang</span><span>: ${startDate} s/d ${endDate}</span></div>
		<div class="detail-row"><span class="detail-label">Lama Magang</span><span>: ${p.durationDays} hari kalender</span></div>
	</div>

	<div class="body-text">
		<p>Telah menyelesaikan kegiatan magang industri di ${companyName} dengan hasil penilaian sebagai berikut:</p>
	</div>

	<!-- SCORE TABLE -->
	<div class="score-section-title">Hasil Penilaian</div>
	<table class="score-table">
		<thead>
			<tr>
				<th class="col-no">No</th>
				<th class="col-indicator">Indikator Keberhasilan</th>
				<th class="col-score">Guru</th>
				<th class="col-score">Mentor</th>
				<th class="col-score">Rata-rata</th>
			</tr>
		</thead>
		<tbody>
			${indicatorRows}
		</tbody>
		<tfoot>
			<tr>
				<td colspan="2" class="total-label">Nilai Akhir</td>
				<td class="total-value">${teacherScore ?? '-'}</td>
				<td class="total-value">${mentorScore ?? '-'}</td>
				<td class="total-final">${totalScore ?? '-'}</td>
			</tr>
		</tfoot>
	</table>

	<!-- CLOSING -->
	<div class="closing-text">
		<p>Demikian surat keterangan ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
	</div>

	<!-- SIGNATURES -->
	<div class="signatures">
		<div class="sig-block">
			<div class="sig-label">Mengetahui,</div>
			<div class="sig-space"></div>
			<div class="sig-line"></div>
			<div class="sig-name">${teacherPrefix}${teacherName}${teacherSuffix ? ', ' + teacherSuffix : ''}</div>
			<div class="sig-title">Guru Pembimbing</div>
			<div class="sig-date">${today}</div>
		</div>
		<div class="sig-block">
			<div class="sig-label">Mentor Industri,</div>
			<div class="sig-space"></div>
			<div class="sig-line"></div>
			<div class="sig-name">${mentorPrefix}${mentorName}${mentorSuffix ? ', ' + mentorSuffix : ''}</div>
			<div class="sig-title">${escapeHtml(p.industryMentor?.position || 'Mentor Industri')}</div>
			<div class="sig-date">${today}</div>
		</div>
	</div>

	</div>
	</div>
</body>
</html>`;

		const certWindow = window.open('about:blank', '_blank');
		if (certWindow) {
			certWindow.document.write(html);
			certWindow.document.close();
		} else {
			toast.error('Popup diblokir oleh browser. Silakan izinkan popup untuk situs ini.');
		}
	}

</script>

<!-- Filters -->
<div
	class="mb-4 animate-fade-in-up relative z-20"
	style="animation-delay: 0.1s; animation-fill-mode: both;"
>
	<SearchFilter
		bind:searchQuery
		{onSearch}
		placeholder="Cari nama siswa..."
		debounceMs={500}
	/>
	<div class="flex flex-col md:flex-row gap-4 w-full mt-4">
		<Select
			options={studentOptions}
			bind:value={selectedStudent}
			placeholder="Semua Murid"
			class="min-w-40 flex-1"
		/>
		<Select
			options={statusOptions}
			bind:value={selectedStatus}
			placeholder="Semua Status"
			class="min-w-40 flex-1"
		/>
		{#if companyOptions}
			<Select
				options={companyOptions}
				bind:value={selectedCompany}
				placeholder="Semua Industri"
				class="min-w-40 flex-1"
			/>
		{/if}
	</div>
</div>

<!-- Table -->
<Table
	{loading}
	empty={participants.length === 0}
	colSpan={colCount}
	emptyMessage="Belum ada peserta magang"
	minWidth="800px"
>
	{#snippet header()}
		<Th>Nama Murid</Th>
		{#if companyOptions}
			<Th align="center">Mitra Industri</Th>
		{/if}
		<Th align="center">Periode Magang</Th>
		<Th align="center">Status</Th>
		<Th align="center">Nilai</Th>
		{#if variant !== "admin"}
			<Th variant="action" bordered={false}>Aksi</Th>
		{:else}
			<Th variant="action" bordered={false}>Sertifikat</Th>
		{/if}
	{/snippet}
	{#snippet loadingSnippet()}
		<Tr>
			<Td colspan={colCount} align="center">
				<Icon name="sync" class="text-lg animate-spin text-primary" />
			</Td>
		</Tr>
	{/snippet}
	{#each participants as p}
		<Tr>
			<Td variant="bold">{p.student?.name || "-"}</Td>
			{#if companyOptions}
				<Td align="center" variant="bold">
					<span
						class="bg-slate-200 border-2 border-on-background px-2 py-1 inline-block text-xs font-mono font-bold"
						>{p.company?.name || "-"}</span
					>
				</Td>
			{/if}
			<Td align="center" variant="mono">
				<div class="mb-1">
					{new Date(p.startDate).toLocaleDateString("id-ID", {
						month: "short",
						year: "numeric",
					})} - {new Date(p.endDate).toLocaleDateString("id-ID", {
						month: "short",
						year: "numeric",
					})}
				</div>
				<div class="text-xs text-secondary font-bold">
					({p.durationDays} hari)
				</div>
			</Td>
			<Td align="center">
				<Badge
					variant={p.status === "active"
						? "primary"
						: p.status === "completed"
							? "secondary"
							: p.status === "cancelled"
								? "error"
								: "warning"}
				>
					{p.status === "active"
						? "Aktif"
						: p.status === "completed"
							? "Selesai"
							: p.status === "cancelled"
								? "Batal"
								: "Berhenti"}
				</Badge>
			</Td>
			<Td align="center" variant="mono">
				<div
					class="flex flex-col gap-1.5 items-center w-full min-w-[140px] mx-auto"
				>
					<div class="flex flex-row justify-center gap-1.5 w-full">
						<div
							class="flex-1 flex flex-col items-center justify-center p-1.5 bg-surface border-2 border-on-background shadow-[2px_2px_0px_0px_#0f172a]"
						>
							<span
								class="text-[9px] text-secondary font-bold uppercase tracking-wider"
								>Mentor</span
							>
							<span
								class="font-black text-[11px] text-on-background leading-none mt-0.5"
								>{getScore(p, "industry_mentor") ?? "-"}</span
							>
						</div>
						<div
							class="flex-1 flex flex-col items-center justify-center p-1.5 bg-surface border-2 border-on-background shadow-[2px_2px_0px_0px_#0f172a]"
						>
							<span
								class="text-[9px] text-secondary font-bold uppercase tracking-wider"
								>Guru</span
							>
							<span
								class="font-black text-[11px] text-on-background leading-none mt-0.5"
								>{getScore(p, "teacher") ?? "-"}</span
							>
						</div>
					</div>
					<div
						class="w-full bg-primary border-2 border-on-background py-1 px-2 flex items-center justify-between shadow-[2px_2px_0px_0px_#0f172a]"
					>
						<span
							class="text-[9px] font-black text-white uppercase tracking-wider"
							>Total</span
						>
						<span class="text-[11px] font-black text-white leading-none"
							>{getTotalScore(p) ?? "-"}</span
						>
					</div>
				</div>
			</Td>
			<Td variant="action" bordered={false}>
				<div class="flex flex-row justify-center items-center gap-2">
					{#if variant !== "admin"}
						{#if !hasAssessed(p)}
							{#if p.isAssessable}
								<ActionButton
									variant="primary"
									icon="edit"
									label="Beri Nilai"
									tooltipPosition="left"
									onclick={() => onAssess?.(p)}
								/>
							{:else}
								<ActionButton
									variant="primary"
									icon="edit"
									label="Belum Waktunya Penilaian"
									tooltipPosition="left"
									disabled={true}
									class="opacity-50 cursor-not-allowed"
								/>
							{/if}
						{:else}
							<ActionButton
								variant="primary"
								icon="check_circle"
								label="Dinilai"
								tooltipPosition="left"
								disabled={true}
								class="opacity-50 cursor-not-allowed"
							/>
						{/if}
					{/if}						<ActionButton
							variant="secondary"
							icon="assessment"
							label="Lihat Rincian"
							tooltipPosition="left"
							onclick={() => openDetailModal(p)}
						/>

					<ActionButton
							variant="success"
							icon="description"
							label="Cetak Surat"
							tooltipPosition="left"
							onclick={() => openCertificate(p)}
						/>

					{#if getMentorAssessment(p)?.attachment?.url}
						<ActionButton
							variant="secondary"
							icon="visibility"
							label="Lihat Sertifikat"
							tooltipPosition="left"
							onclick={() =>
								window.open(
									getAttachmentUrl(
										getMentorAssessment(p)?.attachment?.url,
									),
									"_blank",
								)}
						/>
						{#if variant === "mentor"}
							<ActionButton
								variant="error"
								icon="delete"
								label="Hapus Sertifikat"
								tooltipPosition="left"
								onclick={() => onDeleteCertificate?.(p)}
							/>
						{/if}
					{:else if variant === "mentor"}
						{#if p.status === "completed"}
							<ActionButton
								variant="secondary"
								icon="upload_file"
								label="Upload Sertifikat"
								tooltipPosition="left"
								onclick={() => onUploadCertificate?.(p)}
							/>
						{:else}
							<ActionButton
								variant="secondary"
								icon="upload_file"
								label="Upload Sertifikat"
								tooltipPosition="left"
								disabled={true}
								class="opacity-50 cursor-not-allowed"
							/>
						{/if}
					{:else if variant === "admin"}
						<ActionButton
							variant="secondary"
							icon="visibility_off"
							label="Belum Ada Sertifikat"
							tooltipPosition="left"
							disabled={true}
							class="opacity-50 cursor-not-allowed"
						/>
					{/if}
				</div>
			</Td>
		</Tr>


	{/each}
</Table>

{#if !loading && totalPages > 0}
	<div
		class="mt-4 flex justify-end animate-fade-in-up"
		style="animation-delay: 0.2s; animation-fill-mode: both;"
	>
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}

<!-- Detail Modal with Tabs -->
<Modal bind:show={showDetailModal} title="Rincian Nilai Per Indikator">
	{#if selectedPlacement}
		<!-- Student Info -->
		<div class="mb-3 pb-3 border-b-2 border-on-background">
			<p class="font-headline font-black text-xs uppercase">
				{selectedPlacement.student?.name || "-"}
			</p>
			<p class="font-mono text-[10px] text-secondary">
				{selectedPlacement.company?.name || "-"} &middot; {new Date(selectedPlacement.startDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" })} - {new Date(selectedPlacement.endDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
			</p>
		</div>

		<!-- Tabs -->
		<div class="flex gap-0 border-2 border-on-background mb-3">
			<button
				class="flex-1 py-1.5 text-[10px] font-headline font-black uppercase tracking-wider transition-colors border-r-2 border-on-background {activeTab === 'teacher' ? 'bg-primary text-on-background' : 'bg-surface text-secondary'}"
				onclick={() => activeTab = 'teacher'}
			>
				Guru ({getScore(selectedPlacement, 'teacher') ?? '-'})
			</button>
			<button
				class="flex-1 py-1.5 text-[10px] font-headline font-black uppercase tracking-wider transition-colors {activeTab === 'mentor' ? 'bg-primary text-on-background' : 'bg-surface text-secondary'}"
				onclick={() => activeTab = 'mentor'}
			>
				Mentor ({getScore(selectedPlacement, 'industry_mentor') ?? '-'})
			</button>
		</div>

		<!-- Content -->
		{#if loadingDetails}
			<div class="flex items-center justify-center py-6">
				<Icon name="sync" class="text-sm animate-spin text-primary" />
				<span class="ml-2 font-mono text-[10px] text-secondary">Memuat...</span>
			</div>
		{:else}
			{@const grouped = groupScoresByIndicator(indicatorDetails)}
			{#if grouped.length === 0}
				<p class="font-mono text-[10px] text-secondary py-4 text-center">
					Belum ada data penilaian per indikator.
				</p>
			{:else}
				<div class="space-y-2">
					{#each grouped as ind, idx}
						{@const score = activeTab === 'teacher' ? ind.teacherScore : ind.mentorScore}
						<div
							class="border-2 border-on-background p-2.5 bg-surface shadow-[2px_2px_0px_0px_#0f172a]"
						>
							<div class="flex items-center justify-between mb-1">
								<span class="font-mono text-[10px] text-secondary">#{idx + 1}</span>
								<span
									class="font-headline font-black text-sm"
									class:text-primary={score !== null}
									class:text-secondary={score === null}
								>{score ?? '-'}</span
							>
							</div>
							<p class="font-mono text-[11px] text-on-background leading-snug">
								{ind.description}
							</p>
							{#if ind.teacherScore !== null && ind.mentorScore !== null}
								<div class="mt-1.5 pt-1.5 border-t border-slate-200 flex items-center justify-between">
									<span class="font-mono text-[9px] text-secondary uppercase">Rata-rata</span>
									<span class="font-headline font-bold text-[11px] text-primary">
										{calcAvg(ind)}
								</span>
								</div>
							{/if}
					</div>
				{/each}
			</div>

			<!-- Total -->
			<div class="mt-3 pt-3 border-t-2 border-on-background">
				<div class="flex items-center justify-between">
					<span class="font-headline font-black text-xs uppercase">Total Nilai</span>
					<span class="font-headline font-black text-lg text-primary">
						{getScore(selectedPlacement, activeTab === 'teacher' ? 'teacher' : 'industry_mentor') ?? '-'}
					</span>
				</div>
				{#if getScore(selectedPlacement, 'teacher') !== null && getScore(selectedPlacement, 'industry_mentor') !== null}
					<div class="flex items-center justify-between mt-1">
						<span class="font-mono text-[10px] text-secondary uppercase">Nilai Akhir (rata-rata guru & mentor)</span>
						<span class="font-headline font-black text-sm text-on-background">
							{getTotalScore(selectedPlacement)}
						</span>
					</div>
				{/if}
			</div>
			{/if}
		{/if}
	{/if}
</Modal>
