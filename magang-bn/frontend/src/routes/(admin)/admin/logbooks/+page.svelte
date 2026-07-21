<script lang="ts">
	import { Pagination, SearchFilter, Select, LogbookCard } from '$lib/components/molecules';
	import { apiClient } from '$lib/utils/api';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { onMount, untrack } from 'svelte';

	let currentPage = $state(1);
	let totalPages = $state(1);
	let logbooks = $state<any[]>([]);
	let loading = $state(true);

	let searchQuery = $state("");
	
	let students = $state<any[]>([]);
	let companies = $state<any[]>([]);
	
	let selectedStudentId = $state("");
	let selectedCompanyId = $state("");

	let studentOptions = $derived([
		{ label: '-- Semua Murid --', value: '' },
		...students.map(s => ({ label: `${s.name} (${s.nisn || '-'})`, value: s.id }))
	]);

	let companyOptions = $derived([
		{ label: '-- Semua Industri --', value: '' },
		...companies.map(c => ({ label: c.name, value: c.id }))
	]);

	onMount(async () => {
		const [resStudents, resCompanies] = await Promise.all([
			apiClient('/api/v1/students?limit=1000'),
			apiClient('/api/v1/companies?limit=1000')
		]);
		
		if (resStudents && !resStudents.error) {
			students = resStudents.data || [];
		}
		if (resCompanies && !resCompanies.error) {
			companies = resCompanies.data || [];
		}
	});

	async function fetchLogbooks(page: number) {
		loading = true;
		const currentSearch = untrack(() => searchQuery);
		
		const params = new URLSearchParams({
			page: page.toString(),
			limit: '10'
		});
		
		if (currentSearch) params.append('search', currentSearch);
		if (selectedStudentId) params.append('studentId', selectedStudentId);
		if (selectedCompanyId) params.append('companyId', selectedCompanyId);

		const res = await apiClient(`/api/v1/daily-logbooks?${params.toString()}`);
		if (res && !res.error) {
			logbooks = res.data || [];
			if (res.pagination) {
				totalPages = res.pagination.totalPage || 1;
				currentPage = res.pagination.currentPage || 1;
			}
		} else {
			logbooks = [];
			totalPages = 1;
		}
		loading = false;
	}

	$effect(() => {
		const _s = selectedStudentId;
		const _c = selectedCompanyId;
		untrack(() => {
			currentPage = 1;
		});
		fetchLogbooks(1);
	});
	
	$effect(() => {
		const _p = currentPage;
		untrack(() => {
			if (!loading) fetchLogbooks(_p);
		});
	});

	function handleSearch() {
		currentPage = 1;
		fetchLogbooks(1);
	}
</script>

<svelte:head>
	<title>Rekap Logbook | Magang-BN</title>
</svelte:head>

<div class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-6 animate-fade-in-up">
	<div>
		<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Rekap Logbook Harian</h2>
		<p class="font-mono text-secondary mt-1">Pantau seluruh logbook kegiatan murid di industri.</p>
	</div>
</div>

<div class="mb-6 relative z-10 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<SearchFilter bind:searchQuery onSearch={handleSearch} placeholder="Cari Kegiatan / Deskripsi..." />
	
	<div class="flex flex-col md:flex-row gap-4 mt-4 w-full">
		<div class="w-full md:w-64">
			<Select 
				id="studentFilter"
				options={studentOptions}
				bind:value={selectedStudentId}
				searchable={true}
				placeholder="Semua Murid"
			/>
		</div>
		<div class="w-full md:w-64">
			<Select 
				id="companyFilter"
				options={companyOptions}
				bind:value={selectedCompanyId}
				searchable={true}
				placeholder="Semua Industri"
			/>
		</div>
	</div>
</div>

<div class="animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
	{#if loading}
		<div class="border-4 border-on-background bg-surface shadow-neo p-8 text-center">
			<span class="material-symbols-outlined text-4xl text-primary animate-spin mx-auto mb-2 block">sync</span>
			<p class="font-mono text-secondary">Memuat data logbook...</p>
		</div>
	{:else if logbooks.length === 0}
		<div class="border-4 border-on-background bg-surface shadow-neo p-8 text-center">
			<span class="material-symbols-outlined text-4xl text-secondary mx-auto mb-2 block">inbox</span>
			<p class="font-mono text-secondary">Tidak ada logbook yang sesuai dengan filter.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each logbooks as logbook}
				<LogbookCard {logbook} variant="admin" />
			{/each}
		</div>

		<div class="mt-6 flex justify-center sm:justify-end">
			<Pagination bind:currentPage {totalPages} />
		</div>
	{/if}
</div>
