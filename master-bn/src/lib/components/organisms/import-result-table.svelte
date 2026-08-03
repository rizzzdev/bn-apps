<script lang="ts">
	import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell } from './table';
	import { Tabs } from '$lib/components/molecules';
	import { Badge } from '$lib/components/atoms';

	let {
		result = null,
		successColumns = [],
		failedColumns = []
	} = $props<{
		result?: {
			successCount: number;
			successRows: Record<string, unknown>[];
			failedRows: Record<string, unknown>[];
		} | null;
		successColumns?: { key: string; label: string }[];
		failedColumns?: { key: string; label: string }[];
	}>();

	let activeTab = $state('success');
	let successPage = $state(1);
	let failedPage = $state(1);
	const limit = 10;

	let successTotalPages = $derived(Math.ceil((result?.successRows?.length || 0) / limit));
	let failedTotalPages = $derived(Math.ceil((result?.failedRows?.length || 0) / limit));

	let paginatedSuccess = $derived(
		(result?.successRows || []).slice((successPage - 1) * limit, successPage * limit)
	);
	let paginatedFailed = $derived(
		(result?.failedRows || []).slice((failedPage - 1) * limit, failedPage * limit)
	);

	function renderPagination(totalPages: number, currentPage: number) {
		const pages: (number | string)[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (currentPage > 3) pages.push('...');
			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);
			for (let i = start; i <= end; i++) pages.push(i);
			if (currentPage < totalPages - 2) pages.push('...');
			pages.push(totalPages);
		}
		return pages;
	}
</script>

{#if result}
	<div class="flex flex-col gap-sm">
		<div class="flex items-center gap-sm flex-wrap">
			<Badge color="#BBF7D0" class="text-xs">{result.successCount} Berhasil</Badge>
			{#if result.failedRows.length > 0}
				<Badge color="#FECACA" class="text-xs">{result.failedRows.length} Gagal</Badge>
			{/if}
		</div>

		<Tabs
			tabs={[
				{ id: 'success', label: `Berhasil (${result.successCount})` },
				{ id: 'failed', label: `Gagal (${result.failedRows.length})` }
			]}
			bind:activeTab
			class="mb-0"
		/>

		{#if activeTab === 'success'}
			{#if paginatedSuccess.length === 0}
				<p class="font-body-xs text-on-surface-variant text-center py-md">
					Tidak ada data berhasil
				</p>
			{:else}
				<Table class="mb-0">
					<TableHead>
						<TableRow header>
							{#each successColumns as col (col.key)}
								<TableHeadCell>{col.label}</TableHeadCell>
							{/each}
						</TableRow>
					</TableHead>
					<TableBody>
						{#each paginatedSuccess as row, i (i)}
							<TableRow striped={i % 2 !== 0}>
								{#each successColumns as col (col.key)}
									<TableCell>{row[col.key] ?? '-'}</TableCell>
								{/each}
							</TableRow>
						{/each}
					</TableBody>
				</Table>

				{#if successTotalPages > 1}
					<div class="flex items-center justify-center gap-xs">
						<button
							class="h-7 px-2 bg-surface-container-lowest font-label-sm text-[10px] border-2 rounded-md border-on-background disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={successPage === 1}
							onclick={() => successPage--}
						>
							Prev
						</button>
						{#each renderPagination(successTotalPages, successPage) as page (page)}
							{#if typeof page === 'string'}
								<span class="h-7 w-7 flex items-end justify-center pb-0.5 text-[10px]">...</span>
							{:else}
								<button
									class="h-7 w-7 font-label-sm text-[10px] border-2 rounded-md border-on-background {successPage ===
									page
										? 'bg-secondary text-on-secondary'
										: 'bg-surface-container-lowest'}"
									onclick={() => (successPage = page)}
								>
									{page}
								</button>
							{/if}
						{/each}
						<button
							class="h-7 px-2 bg-surface-container-lowest font-label-sm text-[10px] border-2 rounded-md border-on-background disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={successPage === successTotalPages}
							onclick={() => successPage++}
						>
							Next
						</button>
					</div>
				{/if}
			{/if}
		{:else}
			{#if paginatedFailed.length === 0}
				<p class="font-body-xs text-on-surface-variant text-center py-md">Tidak ada data gagal</p>
			{:else}
				<Table class="mb-0">
					<TableHead>
						<TableRow header>
							{#each failedColumns as col (col.key)}
								<TableHeadCell>{col.label}</TableHeadCell>
							{/each}
						</TableRow>
					</TableHead>
					<TableBody>
						{#each paginatedFailed as row, i (i)}
							<TableRow striped={i % 2 !== 0}>
								{#each failedColumns as col (col.key)}
									<TableCell class={col.key === 'reason' ? 'text-error font-bold' : ''}>
										{row[col.key] ?? '-'}
									</TableCell>
								{/each}
							</TableRow>
						{/each}
					</TableBody>
				</Table>

				{#if failedTotalPages > 1}
					<div class="flex items-center justify-center gap-xs">
						<button
							class="h-7 px-2 bg-surface-container-lowest font-label-sm text-[10px] border-2 rounded-md border-on-background disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={failedPage === 1}
							onclick={() => failedPage--}
						>
							Prev
						</button>
						{#each renderPagination(failedTotalPages, failedPage) as page (page)}
							{#if typeof page === 'string'}
								<span class="h-7 w-7 flex items-end justify-center pb-0.5 text-[10px]">...</span>
							{:else}
								<button
									class="h-7 w-7 font-label-sm text-[10px] border-2 rounded-md border-on-background {failedPage ===
									page
										? 'bg-secondary text-on-secondary'
										: 'bg-surface-container-lowest'}"
									onclick={() => (failedPage = page)}
								>
									{page}
								</button>
							{/if}
						{/each}
						<button
							class="h-7 px-2 bg-surface-container-lowest font-label-sm text-[10px] border-2 rounded-md border-on-background disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={failedPage === failedTotalPages}
							onclick={() => failedPage++}
						>
							Next
						</button>
					</div>
				{/if}
			{/if}
		{/if}
	</div>
{/if}
