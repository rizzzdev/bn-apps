<script lang="ts">
	import { Icon, ActionButton, Badge, Button } from "$lib/components/atoms";
	import {
		Table,
		Th,
		Td,
		Tr,
		Pagination,
		SearchFilter,
	} from "$lib/components/molecules";
	import { apiClient } from "$lib/utils/api";
	import { onMount, untrack } from "svelte";
	import { page } from "$app/stores";

	let mentorId = $derived($page.data.profileData?.mentorId || "");
	let participants = $state<any[]>([]);
	let loading = $state(true);
	let currentPage = $state(1);
	let totalPages = $state(1);
	let searchQuery = $state("");

	async function fetchParticipants(pageNo = 1) {
		loading = true;
		if (mentorId) {
			const currentSearch = untrack(() => searchQuery);
			const searchParam = currentSearch
				? `&search=${encodeURIComponent(currentSearch)}`
				: "";
			const res = await apiClient(
				`/internship-placements?industryMentorId=${mentorId}&page=${pageNo}&limit=10${searchParam}`,
			);
			if (res && !res.error) {
				participants = res.data || [];
				totalPages = res.pagination?.totalPage || 1;
				currentPage = res.pagination?.currentPage || 1;
			}
		}
		loading = false;
	}

	onMount(() => {
		if (mentorId) fetchParticipants(currentPage);
	});

	$effect(() => {
		if (mentorId) {
			untrack(() => fetchParticipants(currentPage));
		}
	});

	function handleSearch() {
		currentPage = 1;
		fetchParticipants(1);
	}
</script>

<svelte:head>
	<title>Peserta Bimbingan | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up">
	<h2 class="font-headline text-xl font-black uppercase tracking-tight">
		Peserta Bimbingan Magang
	</h2>
	<p class="font-mono text-secondary text-xs mt-1">
		Daftar siswa magang di perusahaan Anda yang berada di bawah bimbingan
		Anda.
	</p>
</div>

<!-- Search -->
<div
	class="mb-4 relative z-10 animate-fade-in-up"
	style="animation-delay: 0.1s; animation-fill-mode: both;"
>
	<SearchFilter
		bind:searchQuery
		onSearch={handleSearch}
		placeholder="Cari nama murid..."
	/>
</div>

<!-- Table -->
<Table
	{loading}
	empty={participants.length === 0}
	colSpan={4}
	emptyMessage="Belum ada siswa magang yang dibimbing"
	minWidth="600px"
>
	{#snippet header()}
		<Th>Nama Murid</Th>
		<Th align="center">Periode Magang</Th>
		<Th align="center">Status</Th>
		<Th variant="action" bordered={false}>Aksi</Th>
	{/snippet}
	{#snippet loadingSnippet()}
		<Tr>
			<Td colspan={4} align="center">
				<Icon name="sync" class="text-lg animate-spin text-primary" />
			</Td>
		</Tr>
	{/snippet}
	{#each participants as p}
		<Tr>
			<Td variant="bold">
				{p.student?.name || "-"}
			</Td>
			<Td align="center" variant="mono">
				{new Date(p.startDate).toLocaleDateString("id-ID", {
					day: "numeric",
					month: "short",
					year: "numeric",
				})}
			</Td>
			<Td align="center">
				<Badge
					variant={p.status === "active"
						? "primary"
						: p.status === "completed"
							? "secondary"
							: "warning"}
				>
					{p.status}
				</Badge>
			</Td>
			<Td variant="action" bordered={false}>
				<ActionButton
					variant="secondary"
					icon="visibility"
					label="Lihat Detail Peserta"
				/>
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
