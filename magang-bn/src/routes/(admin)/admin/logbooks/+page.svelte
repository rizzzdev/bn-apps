<script lang="ts">
	import {
		Pagination,
		SearchFilter,
		Select,
		LogbookCard,
	} from "$lib/components/molecules";
	import { Icon } from "$lib/components/atoms";
	import { apiClient } from "$lib/utils/api";
	import { onMount, untrack } from "svelte";

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
		{ label: "-- Semua Murid --", value: "" },
		...students.map((s) => ({
			label: `${s.name || s.fullname} (${s.nisn || "-"})`,
			value: s.id,
		})),
	]);

	let companyOptions = $derived([
		{ label: "-- Semua Industri --", value: "" },
		...companies.map((c) => ({ label: c.name, value: c.id })),
	]);

	onMount(async () => {
		const [resStudents, resCompanies] = await Promise.all([
			apiClient("/students?limit=1000"),
			apiClient("/companies?limit=1000"),
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
			limit: "10",
		});

		if (currentSearch) params.append("search", currentSearch);
		if (selectedStudentId) params.append("studentId", selectedStudentId);
		if (selectedCompanyId) params.append("companyId", selectedCompanyId);

		const res = await apiClient(`/daily-logbooks?${params.toString()}`);
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

<div
	class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-6 animate-fade-in-up"
>
	<div>
		<h2 class="font-headline text-xl font-black uppercase tracking-tight">
			Rekap Logbook Harian
		</h2>
		<p class="font-mono text-secondary text-[10px] mt-1">
			Pantau seluruh logbook kegiatan murid di industri.
		</p>
	</div>
</div>

<div
	class="mb-6 relative z-10 animate-fade-in-up"
	style="animation-delay: 0.1s; animation-fill-mode: both;"
>
	<SearchFilter
		bind:searchQuery
		onSearch={handleSearch}
		placeholder="Cari Kegiatan / Deskripsi..."
	>
		<div class="w-full md:w-60">
			<Select
				id="studentFilter"
				options={studentOptions}
				bind:value={selectedStudentId}
				searchable={true}
				placeholder="Semua Murid"
			/>
		</div>
		<div class="w-full md:w-60">
			<Select
				id="companyFilter"
				options={companyOptions}
				bind:value={selectedCompanyId}
				searchable={true}
				placeholder="Semua Industri"
			/>
		</div>
	</SearchFilter>
</div>

<div
	class="animate-fade-in-up"
	style="animation-delay: 0.2s; animation-fill-mode: both;"
>
	{#if loading}
		<div
			class="border-2 border-on-background bg-surface shadow-neo-sm p-5 text-center"
		>
			<Icon name="sync" class="text-lg text-primary animate-spin mx-auto mb-2 block" />
			<p class="font-mono text-xs text-secondary">Memuat data logbook...</p>
		</div>
	{:else if logbooks.length === 0}
		<div
			class="border-2 border-on-background bg-surface shadow-neo-sm p-5 text-center"
		>
			<Icon name="inbox" class="text-lg text-secondary mx-auto mb-2 block" />
			<p class="font-mono text-xs text-secondary">
				Tidak ada logbook yang sesuai dengan filter.
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each logbooks as logbook}
				<LogbookCard {logbook} variant="admin" />
			{/each}
		</div>

		<div class="mt-4 flex justify-center sm:justify-end">
			<Pagination bind:currentPage {totalPages} />
		</div>
	{/if}
</div>
