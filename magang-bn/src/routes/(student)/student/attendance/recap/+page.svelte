<script lang="ts">
	import { Icon, Button, ActionButton } from "$lib/components/atoms";
	import {
		SearchFilter,
		Select,
		Pagination,
		Modal,
		MapViewer,
		Table,
		Th,
		Td,
		Tr,
	} from "$lib/components/molecules";
	import { untrack } from "svelte";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();

	let searchQuery = $state("");
	let selectedStatus = $state("Semua");
	let selectedType = $state("Semua");

	let statusOptions = [
		{ label: "Semua Status", value: "Semua" },
		{ label: "Diterima", value: "accepted" },
		{ label: "Ditolak", value: "declined" },
	];

	let typeOptions = [
		{ label: "Semua Tipe", value: "Semua" },
		{ label: "Masuk", value: "check_in" },
		{ label: "Pulang", value: "check_out" },
	];

	// Extract company name based on relation
	function getCompanyName(a: any) {
		return a.placement?.company?.name || "Perusahaan";
	}

	let filteredAttendances = $derived.by(() => {
		return data.attendances.filter((a: any) => {
			const matchSearch = getCompanyName(a)
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
			const matchStatus =
				selectedStatus === "Semua" || a.status === selectedStatus;
			const matchType =
				selectedType === "Semua" || a.type === selectedType;
			return matchSearch && matchStatus && matchType;
		});
	});

	let itemsPerPage = 10;
	let currentPage = $state(1);
	let totalPages = $derived(
		Math.ceil(filteredAttendances.length / itemsPerPage) || 1,
	);
	let paginatedAttendances = $derived(
		filteredAttendances.slice(
			(currentPage - 1) * itemsPerPage,
			currentPage * itemsPerPage,
		),
	);
	let empty = $derived(filteredAttendances.length === 0);

	$effect(() => {
		searchQuery;
		selectedStatus;
		selectedType;
		untrack(() => {
			currentPage = 1;
		});
	});

	function formatDate(isoString: string) {
		if (!isoString) return "-";
		return new Date(isoString).toLocaleDateString("id-ID", {
			weekday: "long",
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	}

	function formatTime(isoString: string) {
		if (!isoString) return "-";
		return (
			new Date(isoString).toLocaleTimeString("id-ID", {
				hour: "2-digit",
				minute: "2-digit",
				timeZone: "UTC",
			}) + " WIB"
		);
	}

	let showMapModal = $state(false);
	let selectedLocation = $state<any>(null);

	function openMap(locationMetadata: any) {
		if (!locationMetadata) return;
		selectedLocation =
			typeof locationMetadata === "string"
				? JSON.parse(locationMetadata)
				: locationMetadata;
		showMapModal = true;
	}
</script>

<svelte:head>
	<title>Rekap Presensi | Magang-BN</title>
</svelte:head>

<div
	class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up"
>
	<div>
		<h2 class="font-headline text-xl font-black uppercase tracking-tight">
			Rekap Presensi
		</h2>
		<p class="font-mono text-secondary text-[10px] mt-1">
			Riwayat presensi harian Anda.
		</p>
	</div>
	<Button variant="secondary" href="/student/attendance">
		<Icon name="arrow_back" /> Kembali ke Presensi
	</Button>
</div>

<div
	class="mb-6 relative z-10 animate-fade-in-up"
	style="animation-delay: 0.1s; animation-fill-mode: both;"
>
	<SearchFilter
		bind:searchQuery
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

<Table {empty} colSpan={5} minWidth="900px">
	{#snippet header()}
		<Th>Tanggal & Jam</Th>
		<Th>Tempat Magang</Th>
		<Th align="center">Tipe</Th>
		<Th align="center">Lokasi</Th>
		<Th align="center" bordered={false}>Status & Keterangan</Th>
	{/snippet}
	{#snippet emptySnippet()}
		<Tr>
			<Td colspan={5} align="center" variant="muted">
				<Icon
					name="search_off"
					class="text-base mb-1 block mx-auto opacity-50"
				/>
				Data presensi tidak ditemukan.
			</Td>
		</Tr>
	{/snippet}
	{#each paginatedAttendances as row (row.id)}
		<Tr>
			<Td variant="mono">
				<div class="font-bold mb-1">{formatDate(row.date)}</div>
				<span
					class="bg-slate-100 border-2 border-on-background px-2 py-0.5 font-bold inline-block text-xs font-mono"
				>
					{formatTime(row.time)}
				</span>
			</Td>
			<Td variant="bold">
				{getCompanyName(row)}
			</Td>
			<Td align="center">
				{#if row.type === "check_in"}
					<div
						class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success text-on-background border-2 border-on-background rounded-full font-bold text-xs uppercase tracking-wider shadow-neo-sm"
					>
						<Icon name="login" class="text-xs" /> Masuk
					</div>
				{:else}
					<div
						class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-warning text-on-background border-2 border-on-background rounded-full font-bold text-xs uppercase tracking-wider shadow-neo-sm"
					>
						<Icon name="logout" class="text-xs" /> Pulang
					</div>
				{/if}
			</Td>
			<Td align="center">
				{#if row.locationMetadata}
					<ActionButton
						variant="secondary"
						icon="map"
						label="Peta"
						onclick={() => openMap(row.locationMetadata)}
					/>
				{:else}
					<span class="text-secondary">-</span>
				{/if}
			</Td>
			<Td align="center" bordered={false}>
				<div class="flex flex-col items-center gap-1.5">
					{#if row.status === "accepted"}
						<span
							class="inline-flex items-center justify-center px-2.5 py-1 bg-success border-2 border-on-background font-bold text-xs uppercase tracking-wider w-full shadow-neo-sm"
						>
							<Icon name="check_circle" class="mr-1 text-xs" /> Diterima
						</span>
					{:else if row.status === "declined"}
						<span
							class="inline-flex items-center justify-center px-2.5 py-1 bg-error text-surface border-2 border-on-background font-bold text-xs uppercase tracking-wider w-full shadow-neo-sm"
						>
							<Icon name="cancel" class="mr-1 text-xs" /> Ditolak
						</span>
					{:else}
						<span
							class="inline-flex items-center justify-center px-2.5 py-1 bg-slate-300 border-2 border-on-background font-bold text-xs uppercase tracking-wider w-full shadow-neo-sm"
						>
							{row.status}
						</span>
					{/if}

					{#if row.description}
						<span
							class="text-xs text-on-background font-bold text-center leading-snug w-full block bg-slate-100 border-2 border-on-background p-1.5 rounded-sm"
						>
							{row.description}
						</span>
					{/if}
				</div>
			</Td>
		</Tr>
	{/each}
</Table>

<div
	class="mt-6 flex justify-end animate-fade-in-up"
	style="animation-delay: 0.2s; animation-fill-mode: both;"
>
	<Pagination bind:currentPage {totalPages} />
</div>

<Modal bind:show={showMapModal} title="Lokasi Presensi">
	{#if selectedLocation}
		<div class="mt-2 border-2 border-on-background shadow-neo-sm">
			<div
				class="bg-slate-200 border-b-4 border-on-background px-4 py-2 font-headline font-black text-sm uppercase"
			>
				Peta Lokasi
			</div>
			<div class="p-2">
				<MapViewer location={selectedLocation} />
			</div>
		</div>
		<div class="pt-4 flex justify-end">
			<Button variant="secondary" onclick={() => (showMapModal = false)}
				>Tutup</Button
			>
		</div>
	{/if}
</Modal>
