<script lang="ts">
	import { Icon, ActionButton, Button } from "$lib/components/atoms";
	import { Table, Th, Td, Tr } from "$lib/components/molecules";
	import Pagination from "./pagination.svelte";
	import Modal from "./modal.svelte";
	import MapViewer from "./map-viewer.svelte";
	import SearchFilter from "./search-filter.svelte";
	import Select from "./select.svelte";
	import type { Attendance } from "$lib/types";

	type SelectOption = { label: string; value: string };

	let {
		attendances = [],
		loading = false,
		totalPages = 1,
		currentPage = $bindable(1),
		searchQuery = $bindable(""),
		onSearch,
		studentOptions = [],
		selectedStudentId = $bindable(""),
		companyOptions,
		selectedCompanyId = $bindable(""),
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
	let selectedLocation = $state<{
		latitude: number;
		longitude: number;
	} | null>(null);

	function openMap(locationMetadata: unknown) {
		if (!locationMetadata) return;
		selectedLocation =
			typeof locationMetadata === "string"
				? JSON.parse(locationMetadata)
				: locationMetadata;
		showMapModal = true;
	}

	function formatDate(isoString: string) {
		if (!isoString) return "-";
		return new Date(isoString).toLocaleDateString("id-ID", {
			weekday: "short",
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
				timeZone: "Asia/Jakarta",
			}) + " WIB"
		);
	}
</script>

<div
	class="mb-4 relative z-10 animate-fade-in-up"
	style="animation-delay: 0.1s; animation-fill-mode: both;"
>
	<SearchFilter
		bind:searchQuery
		{onSearch}
		placeholder="Cari Murid atau Keterangan..."
	>
		<div class="w-full {companyOptions ? 'md:w-60' : 'md:w-72'}">
			<Select
				id="studentFilter"
				options={studentOptions}
				bind:value={selectedStudentId}
				searchable={true}
				placeholder="Semua Murid"
			/>
		</div>
		{#if companyOptions}
			<div class="w-full md:w-60">
				<Select
					id="companyFilter"
					options={companyOptions}
					bind:value={selectedCompanyId}
					searchable={true}
					placeholder="Semua Industri"
				/>
			</div>
		{/if}
	</SearchFilter>
</div>

<Table
	{loading}
	empty={attendances.length === 0}
	colSpan={5}
	minWidth="850px"
	emptyMessage="Belum ada data presensi"
>
	{#snippet header()}
		<Th>Murid</Th>
		<Th>Tanggal &amp; Jam</Th>
		<Th align="center">Tipe</Th>
		<Th align="center">Lokasi</Th>
		<Th align="center" bordered={false}>Status &amp; Keterangan</Th>
	{/snippet}
	{#snippet loadingSnippet()}
		<Tr>
			<Td colspan={5} align="center">
				<Icon name="sync" class="text-base animate-spin text-primary" />
			</Td>
		</Tr>
	{/snippet}
	{#snippet emptySnippet()}
		<Tr>
			<Td colspan={5} align="center" variant="muted">
				<Icon
					name="search_off"
					class="text-base mb-1 block mx-auto opacity-50"
				/>
				Belum ada data presensi
			</Td>
		</Tr>
	{/snippet}
	{#each attendances as att}
		<Tr>
			<Td variant="bold">
				{att.student?.name || "Siswa"}
			</Td>
			<Td variant="mono">
				<div class="font-bold mb-1 text-xs">{formatDate(att.date)}</div>
				<span
					class="bg-slate-100 border-2 border-on-background px-2 py-0.5 font-bold inline-block text-xs font-mono"
				>
					{formatTime(att.time)}
				</span>
			</Td>
			<Td align="center">
				{#if att.type === "check_in"}
					<div
						class="inline-flex items-center gap-1.5 px-1.5 py-1 bg-success text-on-background border-2 border-on-background rounded-full font-bold text-[10px] uppercase tracking-wider shadow-neo-sm"
					>
						<Icon name="login" class="text-[8px]" /> Masuk
					</div>
				{:else}
					<div
						class="inline-flex items-center gap-1.5 px-1.5 py-1 bg-warning text-on-background border-2 border-on-background rounded-full font-bold text-[10px] uppercase tracking-wider shadow-neo-sm"
					>
						<Icon name="logout" class="text-[8px]" /> Pulang
					</div>
				{/if}
			</Td>
			<Td align="center">
				{#if att.locationMetadata}
					<ActionButton
						variant="secondary"
						icon="map"
						label="Peta"
						onclick={() => openMap(att.locationMetadata)}
					/>
				{:else}
					<span class="text-secondary">-</span>
				{/if}
			</Td>
			<Td align="center" bordered={false}>
				<div class="flex flex-col items-center gap-1.5">
					{#if att.status === "accepted"}
						<span
							class="inline-flex items-center justify-center px-2.5 py-1 bg-success border-2 border-on-background font-bold text-xs uppercase tracking-wider w-full shadow-neo-sm"
						>
							<Icon
								name="check_circle"
								class="mr-1 text-[10px]"
							/> Diterima
						</span>
					{:else if att.status === "declined"}
						<span
							class="inline-flex items-center justify-center px-1.5 py-1 bg-error text-surface border-2 border-on-background font-bold text-[10px] uppercase tracking-wider w-full shadow-neo-sm"
						>
							<Icon name="cancel" class="mr-1 text-[10px]" /> Ditolak
						</span>
					{:else}
						<span
							class="inline-flex items-center justify-center px-1.5 py-1 bg-slate-300 border-2 border-on-background font-bold text-[10px] uppercase tracking-wider w-full shadow-neo-sm"
						>
							{att.status}
						</span>
					{/if}

					{#if att.description}
						<span
							class="text-xs text-on-background font-bold text-center leading-snug w-full block bg-slate-100 border-2 border-on-background p-1.5 rounded-sm"
						>
							{att.description}
						</span>
					{/if}
				</div>
			</Td>
		</Tr>
	{/each}
</Table>

{#if !loading && totalPages >= 1}
	<div
		class="mt-4 flex justify-end animate-fade-in-up"
		style="animation-delay: 0.2s; animation-fill-mode: both;"
	>
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}

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
