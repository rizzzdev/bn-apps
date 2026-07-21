<script lang="ts">
	import { Icon, ActionButton, Button } from '$lib/components/atoms';
	import Pagination from './pagination.svelte';
	import Modal from './modal.svelte';
	import MapViewer from './map-viewer.svelte';
	import SearchFilter from './search-filter.svelte';
	import Select from './select.svelte';
	import type { Attendance } from '$lib/types';

	type SelectOption = { label: string; value: string };

	let {
		attendances = [],
		loading = false,
		totalPages = 1,
		currentPage = $bindable(1),
		searchQuery = $bindable(''),
		onSearch,
		studentOptions = [],
		selectedStudentId = $bindable(''),
		companyOptions,
		selectedCompanyId = $bindable('')
	}: {
		attendances: Attendance[];
		loading: boolean;
		totalPages: number;
		currentPage: number;
		searchQuery: string;
		onSearch: () => void;
		studentOptions: SelectOption[];
		selectedStudentId: string;
		companyOptions?: SelectOption[];
		selectedCompanyId?: string;
	} = $props();

	let showMapModal = $state(false);
	let selectedLocation = $state<{ latitude: number; longitude: number } | null>(null);

	function openMap(locationMetadata: unknown) {
		if (!locationMetadata) return;
		selectedLocation = typeof locationMetadata === 'string' ? JSON.parse(locationMetadata) : locationMetadata;
		showMapModal = true;
	}

	function formatDate(isoString: string) {
		if (!isoString) return '-';
		return new Date(isoString).toLocaleDateString('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}

	function formatTime(isoString: string) {
		if (!isoString) return '-';
		return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB';
	}
</script>

<div class="mb-6 relative z-10 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<SearchFilter bind:searchQuery {onSearch} placeholder="Cari Murid atau Keterangan..." />
	
	<div class="flex flex-col md:flex-row gap-4 mt-4 w-full">
		<div class="w-full {companyOptions ? 'md:w-64' : ''}">
			<Select 
				id="studentFilter"
				options={studentOptions}
				bind:value={selectedStudentId}
				searchable={true}
				placeholder="Semua Murid"
			/>
		</div>
		{#if companyOptions}
			<div class="w-full md:w-64">
				<Select 
					id="companyFilter"
					options={companyOptions}
					bind:value={selectedCompanyId}
					searchable={true}
					placeholder="Semua Industri"
				/>
			</div>
		{/if}
	</div>
</div>

<div class="border-4 border-on-background bg-surface overflow-x-auto shadow-neo animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<table class="w-full text-left border-collapse min-w-[900px]">
		<thead>
			<tr class="border-b-4 border-on-background bg-slate-100 font-headline font-black uppercase text-sm">
				<th class="p-4 border-r-4 border-on-background w-[200px]">Murid</th>
				<th class="p-4 border-r-4 border-on-background whitespace-nowrap">Tanggal &amp; Jam</th>
				<th class="p-4 border-r-4 border-on-background whitespace-nowrap text-center">Tipe</th>
				<th class="p-4 border-r-4 border-on-background text-center w-[150px]">Lokasi</th>
				<th class="p-4 text-center w-[250px]">Status &amp; Keterangan</th>
			</tr>
		</thead>
		<tbody>
			{#if loading}
				<tr>
					<td colspan="5" class="p-8 text-center">
						<Icon name="sync" class="text-4xl animate-spin text-primary" />
					</td>
				</tr>
			{:else if attendances.length === 0}
				<tr>
					<td colspan="5" class="p-8 text-center font-mono font-bold text-secondary">
						<Icon name="search_off" class="text-4xl mb-2 block mx-auto opacity-50" />
						Belum ada data presensi
					</td>
				</tr>
			{:else}
				{#each attendances as att}
					<tr class="border-b-4 border-on-background hover:bg-slate-50 transition-colors font-mono text-sm group last:border-b-0">
						<td class="p-4 border-r-4 border-on-background font-sans font-bold">
							{att.student?.name || 'Siswa'}
						</td>
						<td class="p-4 border-r-4 border-on-background">
							<div class="font-bold mb-1">{formatDate(att.date)}</div>
							<span class="bg-slate-100 border-2 border-on-background px-2 py-1 font-bold inline-block text-xs">
								{formatTime(att.time)}
							</span>
						</td>
						<td class="p-4 border-r-4 border-on-background text-center">
							{#if att.type === 'check_in'}
								<div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success text-on-background border-2 border-on-background rounded-full font-bold text-xs uppercase tracking-wider shadow-neo-sm">
									<Icon name="login" class="text-sm" /> Masuk
								</div>
							{:else}
								<div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning text-on-background border-2 border-on-background rounded-full font-bold text-xs uppercase tracking-wider shadow-neo-sm">
									<Icon name="logout" class="text-sm" /> Pulang
								</div>
							{/if}
						</td>
						<td class="p-4 border-r-4 border-on-background text-center">
							{#if att.locationMetadata}
								<ActionButton variant="secondary" icon="map" label="Peta" onclick={() => openMap(att.locationMetadata)} />
							{:else}
								<span class="text-secondary">-</span>
							{/if}
						</td>
						<td class="p-4 align-top">
							<div class="flex flex-col items-center gap-2">
								{#if att.status === 'accepted'}
									<span class="inline-flex items-center justify-center px-3 py-1 bg-success border-2 border-on-background font-bold text-xs uppercase tracking-wider w-full shadow-neo-sm">
										<Icon name="check_circle" class="mr-1 text-sm" /> Diterima
									</span>
								{:else if att.status === 'declined'}
									<span class="inline-flex items-center justify-center px-3 py-1 bg-error text-surface border-2 border-on-background font-bold text-xs uppercase tracking-wider w-full shadow-neo-sm">
										<Icon name="cancel" class="mr-1 text-sm" /> Ditolak
									</span>
								{:else}
									<span class="inline-flex items-center justify-center px-3 py-1 bg-slate-300 border-2 border-on-background font-bold text-xs uppercase tracking-wider w-full shadow-neo-sm">
										{att.status}
									</span>
								{/if}
								
								{#if att.description}
									<span class="text-[11px] text-on-background font-bold text-center leading-snug w-full block bg-slate-100 border-2 border-on-background p-2 rounded-sm mt-1">
										{att.description}
									</span>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

{#if !loading && totalPages >= 1}
	<div class="mt-6 flex justify-end animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}

<Modal bind:show={showMapModal} title="Lokasi Presensi">
	{#if selectedLocation}
		<div class="mt-2 border-4 border-on-background shadow-neo-sm">
			<div class="bg-slate-200 border-b-4 border-on-background px-4 py-2 font-headline font-black text-sm uppercase">Peta Lokasi</div>
			<div class="p-2">
				<MapViewer location={selectedLocation} />
			</div>
		</div>
		<div class="pt-4 flex justify-end">
			<Button variant="secondary" onclick={() => showMapModal = false}>Tutup</Button>
		</div>
	{/if}
</Modal>
