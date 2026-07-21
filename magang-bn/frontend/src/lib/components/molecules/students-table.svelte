<script lang="ts">
	import { Icon, Badge } from '$lib/components/atoms';
	import Pagination from './pagination.svelte';
	import SearchFilter from './search-filter.svelte';
	import type { InternshipPlacement } from '$lib/types';
	import { formatFullName } from '$lib/utils/helpers';

	let {
		placements = [],
		loading = false,
		totalPages = 1,
		currentPage = $bindable(1),
		searchQuery = $bindable(''),
		onSearch
	}: {
		placements: InternshipPlacement[];
		loading: boolean;
		totalPages: number;
		currentPage: number;
		searchQuery: string;
		onSearch: () => void;
	} = $props();

	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
	}
</script>

<div class="animate-fade-in-up mb-4" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<SearchFilter bind:searchQuery {onSearch} placeholder="Cari Murid atau Mitra Industri..." />
</div>

<div class="bg-surface border-4 border-on-background shadow-neo overflow-x-auto animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
	<table class="w-full text-left border-collapse min-w-[800px]">
		<thead>
			<tr class="border-b-4 border-on-background bg-slate-200 font-headline font-black uppercase text-sm">
				<th class="p-4 border-r-4 border-on-background">Murid</th>
				<th class="p-4 border-r-4 border-on-background">Pembimbing</th>
				<th class="p-4 border-r-4 border-on-background">Mitra Industri</th>
				<th class="p-4 border-r-4 border-on-background">Periode Magang</th>
				<th class="p-4 text-center">Status</th>
			</tr>
		</thead>
		<tbody>
			{#if loading}
				<tr>
					<td colspan="5" class="p-8 text-center">
						<Icon name="sync" class="text-4xl animate-spin text-primary" />
					</td>
				</tr>
			{:else if placements.length === 0}
				<tr>
					<td colspan="5" class="p-8 text-center font-mono text-secondary">Tidak ada data murid magang.</td>
				</tr>
			{:else}
				{#each placements as placement}
					<tr class="border-b-4 border-on-background hover:bg-blue-50 transition-colors">
						<td class="p-4 border-r-4 border-on-background font-bold">{formatFullName(placement.student)}</td>
						<td class="p-4 border-r-4 border-on-background text-sm">
							<div class="flex flex-col gap-2">
								<div class="inline-flex items-center gap-2 bg-blue-100 text-blue-900 border-2 border-blue-900 px-3 py-2 shadow-neo-sm">
									<Icon name="school" class="text-xl shrink-0" />
									<div class="flex flex-col">
										<span class="font-bold">{formatFullName(placement.teacher)}</span>
										<span class="text-[10px] uppercase font-black tracking-wider opacity-80">Guru Pendamping</span>
									</div>
								</div>
								<div class="inline-flex items-center gap-2 bg-orange-100 text-orange-900 border-2 border-orange-900 px-3 py-2 shadow-neo-sm">
									<Icon name="work" class="text-xl shrink-0" />
									<div class="flex flex-col">
										<span class="font-bold">{formatFullName(placement.industryMentor)}</span>
										<span class="text-[10px] uppercase font-black tracking-wider opacity-80">Mentor Industri</span>
									</div>
								</div>
							</div>
						</td>
						<td class="p-4 border-r-4 border-on-background font-mono text-sm">{placement.company?.name || placement.company?.nama || placement.companyId || '-'}</td>
						<td class="p-4 border-r-4 border-on-background text-sm font-mono">
							<div class="mb-1">{formatDate(placement.startDate)} - {formatDate(placement.startDate)}</div>
							<div class="text-xs text-secondary">({placement.durationDays} Hari)</div>
						</td>
						<td class="p-4 text-center align-middle">
							<Badge variant={placement.status === 'active' ? 'primary' : placement.status === 'completed' ? 'secondary' : placement.status === 'cancelled' ? 'error' : 'warning'}>
								{placement.status === 'active' ? 'Aktif' : placement.status === 'completed' ? 'Selesai' : placement.status === 'cancelled' ? 'Batal' : 'Berhenti'}
							</Badge>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

{#if !loading && totalPages > 1}
	<div class="mt-6 flex justify-end animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}
