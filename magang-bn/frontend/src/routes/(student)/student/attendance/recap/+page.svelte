<script lang="ts">
	import { Icon, Button, ActionButton } from '$lib/components/atoms';
	import { SearchFilter, Select, Pagination, Modal, MapViewer } from '$lib/components/molecules';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedStatus = $state('Semua');
	let selectedType = $state('Semua');

	let statusOptions = [
		{ label: 'Semua Status', value: 'Semua' },
		{ label: 'Diterima', value: 'accepted' },
		{ label: 'Ditolak', value: 'declined' }
	];

	let typeOptions = [
		{ label: 'Semua Tipe', value: 'Semua' },
		{ label: 'Masuk', value: 'check_in' },
		{ label: 'Pulang', value: 'check_out' }
	];

	// Extract company name based on relation
	function getCompanyName(a: any) {
		return a.placement?.company?.name || 'Perusahaan';
	}

	let filteredAttendances = $derived.by(() => {
		return data.attendances.filter((a: any) => {
			const matchSearch = getCompanyName(a).toLowerCase().includes(searchQuery.toLowerCase());
			const matchStatus = selectedStatus === 'Semua' || a.status === selectedStatus;
			const matchType = selectedType === 'Semua' || a.type === selectedType;
			return matchSearch && matchStatus && matchType;
		});
	});

	let itemsPerPage = 10;
	let currentPage = $state(1);
	let totalPages = $derived(Math.ceil(filteredAttendances.length / itemsPerPage) || 1);
	let paginatedAttendances = $derived(filteredAttendances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));

	$effect(() => {
		searchQuery;
		selectedStatus;
		selectedType;
		untrack(() => {
			currentPage = 1;
		});
	});

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
		return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' WIB';
	}
	
	let showMapModal = $state(false);
	let selectedLocation = $state<any>(null);
	
	function openMap(locationMetadata: any) {
		if (!locationMetadata) return;
		selectedLocation = typeof locationMetadata === 'string' ? JSON.parse(locationMetadata) : locationMetadata;
		showMapModal = true;
	}
</script>

<svelte:head>
	<title>Rekap Presensi | Magang-BN</title>
</svelte:head>

<div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
	<div>
		<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Rekap Presensi</h2>
		<p class="font-mono text-secondary mt-1">Riwayat presensi harian Anda.</p>
	</div>
	<Button variant="secondary" href="/student/attendance">
		<Icon name="arrow_back" /> Kembali ke Presensi
	</Button>
</div>

<div class="mb-6 relative z-10 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<SearchFilter 
		bind:searchQuery={searchQuery}
		placeholder="Cari berdasarkan tempat magang..."
	/>
	
	<div class="flex flex-col sm:flex-row gap-4 mt-4 w-full">
		<div class="w-full sm:w-48">
			<Select 
				id="typeFilter"
				options={typeOptions}
				bind:value={selectedType}
				searchable={false}
			/>
		</div>
		<div class="w-full sm:w-48">
			<Select 
				id="statusFilter"
				options={statusOptions}
				bind:value={selectedStatus}
				searchable={false}
			/>
		</div>
	</div>
</div>

<div class="bg-surface border-4 border-on-background shadow-neo overflow-x-auto animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
	<table class="w-full text-left border-collapse min-w-[900px]">
		<thead>
			<tr class="border-b-4 border-on-background bg-slate-100 font-headline font-black uppercase text-sm">
				<th class="p-4 border-r-4 border-on-background whitespace-nowrap">Tanggal & Jam</th>
				<th class="p-4 border-r-4 border-on-background">Tempat Magang</th>
				<th class="p-4 border-r-4 border-on-background whitespace-nowrap text-center">Tipe</th>
				<th class="p-4 border-r-4 border-on-background text-center w-[150px]">Lokasi</th>
				<th class="p-4 text-center w-[250px]">Status & Keterangan</th>
			</tr>
		</thead>
		<tbody>
			{#if filteredAttendances.length === 0}
				<tr>
					<td colspan="5" class="p-8 text-center font-mono font-bold text-secondary">
						<Icon name="search_off" class="text-4xl mb-2 block mx-auto opacity-50" />
						Data presensi tidak ditemukan.
					</td>
				</tr>
			{:else}
				{#each paginatedAttendances as row (row.id)}
					<tr class="border-b-4 border-on-background hover:bg-slate-50 transition-colors font-mono text-sm group last:border-b-0">
						<td class="p-4 border-r-4 border-on-background">
							<div class="font-bold mb-1">{formatDate(row.date)}</div>
							<span class="bg-slate-100 border-2 border-on-background px-2 py-1 font-bold inline-block text-xs">
								{formatTime(row.time)}
							</span>
						</td>
						<td class="p-4 border-r-4 border-on-background font-sans font-bold">
							{getCompanyName(row)}
						</td>
						<td class="p-4 border-r-4 border-on-background text-center">
							{#if row.type === 'check_in'}
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
							{#if row.locationMetadata}
								<ActionButton variant="secondary" icon="map" label="Peta" onclick={() => openMap(row.locationMetadata)} />
							{:else}
								<span class="text-secondary">-</span>
							{/if}
						</td>
						<td class="p-4 align-top">
							<div class="flex flex-col items-center gap-2">
								{#if row.status === 'accepted'}
									<span class="inline-flex items-center justify-center px-3 py-1 bg-success border-2 border-on-background font-bold text-xs uppercase tracking-wider w-full shadow-neo-sm">
										<Icon name="check_circle" class="mr-1 text-sm" /> Diterima
									</span>
								{:else if row.status === 'declined'}
									<span class="inline-flex items-center justify-center px-3 py-1 bg-error text-surface border-2 border-on-background font-bold text-xs uppercase tracking-wider w-full shadow-neo-sm">
										<Icon name="cancel" class="mr-1 text-sm" /> Ditolak
									</span>
								{:else}
									<span class="inline-flex items-center justify-center px-3 py-1 bg-slate-300 border-2 border-on-background font-bold text-xs uppercase tracking-wider w-full shadow-neo-sm">
										{row.status}
									</span>
								{/if}
								
								{#if row.description}
									<span class="text-[11px] text-on-background font-bold text-center leading-snug w-full block bg-slate-100 border-2 border-on-background p-2 rounded-sm mt-1">
										{row.description}
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

<div class="mt-6 flex justify-end animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
	<Pagination bind:currentPage {totalPages} />
</div>

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
