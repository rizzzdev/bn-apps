<script lang="ts">
	import { Icon, Badge } from "$lib/components/atoms";
	import Pagination from "./pagination.svelte";
	import SearchFilter from "./search-filter.svelte";
	import { Table, Th, Td, Tr } from "$lib/components/molecules";
	import type { InternshipPlacement } from "$lib/types";
	import { formatFullName } from "$lib/utils/helpers";

	let {
		placements = [],
		loading = false,
		totalPages = 1,
		currentPage = $bindable(1),
		searchQuery = $bindable(""),
		onSearch,
	}: {
		placements: InternshipPlacement[];
		loading: boolean;
		totalPages: number;
		currentPage: number;
		searchQuery: string;
		onSearch: () => void;
	} = $props();

	function formatDate(dateStr: string) {
		if (!dateStr) return "-";
		return new Intl.DateTimeFormat("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(new Date(dateStr));
	}
</script>

<div
	class="animate-fade-in-up mb-4"
	style="animation-delay: 0.1s; animation-fill-mode: both;"
>
	<SearchFilter
		bind:searchQuery
		{onSearch}
		placeholder="Cari Murid atau Mitra Industri..."
	/>
</div>

<Table
	{loading}
	empty={placements.length === 0}
	colSpan={5}
	emptyMessage="Tidak ada data murid magang."
	minWidth="800px"
>
	{#snippet header()}
		<Th>Murid</Th>
		<Th>Pembimbing</Th>
		<Th>Mitra Industri</Th>
		<Th>Periode Magang</Th>
		<Th align="center" bordered={false}>Status</Th>
	{/snippet}
	{#snippet loadingSnippet()}
		<Tr>
			<Td colspan={5} align="center">
				<Icon name="sync" class="text-lg animate-spin text-primary" />
			</Td>
		</Tr>
	{/snippet}
	{#each placements as placement}
		<Tr>
			<Td variant="bold">{formatFullName(placement.student)}</Td>
			<Td>
				<div class="flex flex-col gap-2">
					<div
						class="inline-flex items-center gap-2 bg-blue-100 text-blue-900 border-2 border-blue-900 px-3 py-2 shadow-neo-sm"
					>
						<Icon name="school" class="text-xs shrink-0" />
						<div class="flex flex-col">
							<span class="font-bold text-xs"
								>{formatFullName(placement.teacher)}</span
							>
							<span
								class="text-[10px] uppercase font-black tracking-wider opacity-80"
								>Guru Pendamping</span
							>
						</div>
					</div>
					<div
						class="inline-flex items-center gap-2 bg-orange-100 text-orange-900 border-2 border-orange-900 px-3 py-2 shadow-neo-sm"
					>
						<Icon name="work" class="text-xs shrink-0" />
						<div class="flex flex-col">
							<span class="font-bold text-xs"
								>{formatFullName(
									placement.industryMentor,
								)}</span
							>
							<span
								class="text-[10px] uppercase font-black tracking-wider opacity-80"
								>Mentor Industri</span
							>
						</div>
					</div>
				</div>
			</Td>
			<Td variant="bold"
				>{placement.company?.name ||
					placement.company?.nama ||
					placement.companyId ||
					"-"}</Td
			>
			<Td variant="mono">
				<div class="mb-1">
					{formatDate(placement.startDate)} - {formatDate(
						placement.endDate,
					)}
				</div>
				<div class="text-xs text-secondary">
					({placement.durationDays} Hari)
				</div>
			</Td>
			<Td align="center" bordered={false}>
				<Badge
					variant={placement.status === "active"
						? "primary"
						: placement.status === "completed"
							? "secondary"
							: placement.status === "cancelled"
								? "error"
								: "warning"}
				>
					{placement.status === "active"
						? "Aktif"
						: placement.status === "completed"
							? "Selesai"
							: placement.status === "cancelled"
								? "Batal"
								: "Berhenti"}
				</Badge>
			</Td>
		</Tr>
	{/each}
</Table>

{#if !loading && totalPages > 1}
	<div
		class="mt-4 flex justify-end animate-fade-in-up"
		style="animation-delay: 0.2s; animation-fill-mode: both;"
	>
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}
