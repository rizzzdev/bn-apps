<script lang="ts">
	import { Icon, ActionButton, Badge, Button } from '$lib/components/atoms';
	import Pagination from './pagination.svelte';
	import SearchFilter from './search-filter.svelte';
	import Select from './select.svelte';
	import { PUBLIC_API_URL } from '$env/static/public';
	import type { InternshipPlacement } from '$lib/types';

	type SelectOption = { value: string; label: string };

	let {
		participants = [],
		loading = false,
		totalPages = 1,
		currentPage = $bindable(1),
		searchQuery = $bindable(''),
		onSearch,
		studentOptions = [],
		selectedStudent = $bindable(''),
		statusOptions = [],
		selectedStatus = $bindable(''),
		companyOptions,
		selectedCompany = $bindable(''),
		variant = 'admin',
		onAssess,
		onUploadCertificate,
		onDeleteCertificate
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
		variant: 'admin' | 'teacher' | 'mentor';
		onAssess?: (p: InternshipPlacement) => void;
		onUploadCertificate?: (p: InternshipPlacement) => void;
		onDeleteCertificate?: (p: InternshipPlacement) => void;
	} = $props();

	function getScore(p: any, type: string) {
		const assessment = p.assessments?.find((a: any) => a.assessorType === type);
		return assessment ? Number(assessment.finalScore) : null;
	}

	function getMentorAssessment(p: any) {
		return p.assessments?.find((a: any) => a.assessorType === 'industry_mentor');
	}

	function getTotalScore(p: any) {
		const mentorScore = getScore(p, 'industry_mentor');
		const teacherScore = getScore(p, 'teacher');
		if (mentorScore !== null && teacherScore !== null) {
			return Math.round((mentorScore + teacherScore) / 2);
		}
		return null;
	}

	// Who can assess based on variant
	let hasAssessed = $derived.by(() => (p: any) => {
		if (variant === 'teacher') return getScore(p, 'teacher') !== null;
		if (variant === 'mentor') return getScore(p, 'industry_mentor') !== null;
		return true;
	});

	// Column count depends on whether company column is shown
	let colCount = $derived(companyOptions ? 6 : 5);
</script>

<!-- Filters -->
<div class="mb-6 animate-fade-in-up relative z-20" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<SearchFilter bind:searchQuery {onSearch} placeholder="Cari nama siswa..." debounceMs={500} />
	<div class="flex flex-col md:flex-row gap-4 w-full mt-4">
		<Select options={studentOptions} bind:value={selectedStudent} placeholder="Semua Murid" class="min-w-40 flex-1" />
		<Select options={statusOptions} bind:value={selectedStatus} placeholder="Semua Status" class="min-w-40 flex-1" />
		{#if companyOptions}
			<Select options={companyOptions} bind:value={selectedCompany} placeholder="Semua Industri" class="min-w-40 flex-1" />
		{/if}
	</div>
</div>

<!-- Table -->
<div class="border-4 border-on-background bg-surface overflow-x-auto shadow-neo animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
	<table class="w-full text-left border-collapse min-w-[800px]">
		<thead>
			<tr class="border-b-4 border-on-background bg-slate-100 font-headline font-black uppercase text-sm">
				<th class="p-4 border-r-4 border-on-background">Nama Murid</th>
				{#if companyOptions}
					<th class="p-4 border-r-4 border-on-background text-center">Mitra Industri</th>
				{/if}
				<th class="p-4 border-r-4 border-on-background text-center">Periode Magang</th>
				<th class="p-4 border-r-4 border-on-background text-center w-24">Status</th>
				<th class="p-4 border-r-4 border-on-background text-center w-32">Nilai</th>
				{#if variant !== 'admin'}
					<th class="p-4 text-center w-40">Aksi</th>
				{:else}
					<th class="p-4 text-center w-40">Sertifikat</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#if loading}
				<tr>
					<td colspan={colCount} class="p-8 text-center">
						<Icon name="sync" class="text-4xl animate-spin text-primary" />
					</td>
				</tr>
			{:else if participants.length === 0}
				<tr>
					<td colspan={colCount} class="p-8 text-center font-mono text-secondary">Belum ada peserta magang</td>
				</tr>
			{:else}
				{#each participants as p}
					<tr class="border-b-4 border-on-background hover:bg-blue-50 transition-colors">
						<td class="p-4 border-r-4 border-on-background font-bold">{p.student?.name || '-'}</td>
						{#if companyOptions}
							<td class="p-4 border-r-4 border-on-background text-center font-mono font-bold">
								<span class="bg-slate-200 border-2 border-on-background px-2 py-0.5 inline-block text-sm">{p.company?.name || '-'}</span>
							</td>
						{/if}
						<td class="p-4 border-r-4 border-on-background text-center font-mono text-sm">
							<div class="mb-1">{new Date(p.startDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })} - {new Date(p.endDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</div>
							<div class="text-xs text-secondary font-bold">({p.durationDays} hari)</div>
						</td>
						<td class="p-4 border-r-4 border-on-background text-center">
							<Badge variant={p.status === 'active' ? 'primary' : p.status === 'completed' ? 'secondary' : p.status === 'cancelled' ? 'error' : 'warning'}>
								{p.status === 'active' ? 'Aktif' : p.status === 'completed' ? 'Selesai' : p.status === 'cancelled' ? 'Batal' : 'Berhenti'}
							</Badge>
						</td>
						<td class="p-4 border-r-4 border-on-background text-center font-mono">
							<div class="flex flex-col gap-2 items-center w-full min-w-[120px] mx-auto">
								<div class="flex flex-row justify-center gap-2 w-full">
									<div class="flex-1 flex flex-col items-center justify-center p-1 bg-surface border-2 border-on-background shadow-[2px_2px_0px_0px_#0f172a]">
										<span class="text-[9px] text-secondary font-bold uppercase tracking-tighter">Mentor</span>
										<span class="font-black text-sm text-on-background leading-none mt-0.5">{getScore(p, 'industry_mentor') ?? '-'}</span>
									</div>
									<div class="flex-1 flex flex-col items-center justify-center p-1 bg-surface border-2 border-on-background shadow-[2px_2px_0px_0px_#0f172a]">
										<span class="text-[9px] text-secondary font-bold uppercase tracking-tighter">Guru</span>
										<span class="font-black text-sm text-on-background leading-none mt-0.5">{getScore(p, 'teacher') ?? '-'}</span>
									</div>
								</div>
								<div class="w-full bg-primary border-2 border-on-background py-1 px-2 flex items-center justify-between shadow-[2px_2px_0px_0px_#0f172a]">
									<span class="text-[10px] font-black text-white uppercase tracking-wider">Total</span>
									<span class="text-base font-black text-white leading-none">{getTotalScore(p) ?? '-'}</span>
								</div>
							</div>
						</td>
						<td class="p-4 text-center">
							<div class="flex flex-row justify-center items-center gap-2">
								{#if variant !== 'admin'}
									{#if !hasAssessed(p)}
										{#if p.isAssessable}
											<ActionButton variant="primary" icon="edit" label="Beri Nilai" tooltipPosition="left" onclick={() => onAssess?.(p)} />
										{:else}
											<ActionButton variant="primary" icon="edit" label="Belum Waktunya Penilaian" tooltipPosition="left" disabled={true} class="opacity-50 cursor-not-allowed" />
										{/if}
									{:else}
										<ActionButton variant="primary" icon="check_circle" label="Dinilai" tooltipPosition="left" disabled={true} class="opacity-50 cursor-not-allowed" />
									{/if}
								{/if}

								{#if getMentorAssessment(p)?.attachment?.url}
									<ActionButton variant="secondary" icon="visibility" label="Lihat Sertifikat" tooltipPosition="left" onclick={() => window.open(PUBLIC_API_URL + getMentorAssessment(p)?.attachment?.url, '_blank')} />
									{#if variant === 'mentor'}
										<ActionButton variant="error" icon="delete" label="Hapus Sertifikat" tooltipPosition="left" onclick={() => onDeleteCertificate?.(p)} />
									{/if}
								{:else if variant === 'mentor'}
									{#if p.status === 'completed'}
										<ActionButton variant="secondary" icon="upload_file" label="Upload Sertifikat" tooltipPosition="left" onclick={() => onUploadCertificate?.(p)} />
									{:else}
										<ActionButton variant="secondary" icon="upload_file" label="Upload Sertifikat" tooltipPosition="left" disabled={true} class="opacity-50 cursor-not-allowed" />
									{/if}
								{:else if variant === 'admin'}
									<ActionButton variant="secondary" icon="visibility_off" label="Belum Ada Sertifikat" tooltipPosition="left" disabled={true} class="opacity-50 cursor-not-allowed" />
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

{#if !loading && totalPages > 0}
	<div class="mt-6 flex justify-end animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}
