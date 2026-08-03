<script lang="ts">
	import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell } from './table';
	import { Button, Icon } from '$lib/components/atoms';
	import * as XLSX from 'xlsx';

	let {
		file = null,
		columns = [],
		showPlaceholder = false,
		isProcessing = false,
		onConfirm = $bindable(),
		onCancel = $bindable()
	} = $props<{
		file?: File | null;
		columns?: { key: string; label: string }[];
		showPlaceholder?: boolean;
		isProcessing?: boolean;
		onConfirm?: (data: Record<string, unknown>[]) => void;
		onCancel?: () => void;
	}>();

	let rows = $state<Record<string, unknown>[]>([]);
	let isLoading = $state(false);
	let error = $state('');
	let currentPage = $state(1);
	let limit = 10;

	let totalPages = $derived(Math.ceil(rows.length / limit));
	let totalItems = $derived(rows.length);
	let startItem = $derived((currentPage - 1) * limit + 1);
	let endItem = $derived(Math.min(currentPage * limit, totalItems));

	let visiblePages = $derived.by(() => {
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
	});

	let paginatedRows = $derived(rows.slice((currentPage - 1) * limit, currentPage * limit));

	$effect(() => {
		if (file) {
			parseFile(file);
		}
	});

	async function parseFile(f: File) {
		isLoading = true;
		error = '';
		rows = [];
		currentPage = 1;
		try {
			const buffer = await f.arrayBuffer();
			const workbook = XLSX.read(buffer, { type: 'buffer' });
			const sheetName = workbook.SheetNames[0];
			const sheet = workbook.Sheets[sheetName];
			const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
			if (parsed.length === 0) {
				error = 'File Excel kosong atau tidak memiliki data';
				return;
			}
			rows = parsed;
		} catch {
			error = 'Gagal membaca file Excel. Pastikan format file benar (.xlsx)';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex flex-col gap-sm">
	{#if isLoading}
		<div class="flex items-center justify-center py-lg">
			<span class="font-body-base text-on-surface-variant">Membaca file Excel...</span>
		</div>
	{:else if error}
		<div class="p-sm bg-error-container border-2 border-error rounded-lg">
			<span class="font-body-base text-error">{error}</span>
		</div>
	{:else if rows.length > 0}
		<div class="flex items-center justify-between">
			<p class="font-body-base text-xs text-on-surface-variant">
				{totalItems} data ditemukan. Menampilkan {startItem}-{endItem}
			</p>
		</div>

		<Table class="mb-0">
			<TableHead>
				<TableRow header>
					{#each columns as col (col.key)}
						<TableHeadCell>{col.label}</TableHeadCell>
					{/each}
				</TableRow>
			</TableHead>
			<TableBody>
				{#each paginatedRows as row, i (i)}
					<TableRow striped={i % 2 !== 0}>
						{#each columns as col (col.key)}
							<TableCell>{showPlaceholder ? '-' : (row[col.key] ?? '-')}</TableCell>
						{/each}
					</TableRow>
				{/each}
			</TableBody>
		</Table>

		{#if totalPages > 1}
			<div class="flex items-center justify-center gap-xs">
				<button
					class="h-7 px-2 bg-surface-container-lowest font-label-sm text-[10px] border-2 rounded-md border-on-background disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={currentPage === 1}
					onclick={() => currentPage--}
				>
					Prev
				</button>
				{#each visiblePages as page (page)}
					{#if typeof page === 'string'}
						<span class="h-7 w-7 flex items-end justify-center pb-0.5 text-[10px]">...</span>
					{:else}
						<button
							class="h-7 w-7 font-label-sm text-[10px] border-2 rounded-md border-on-background {currentPage ===
							page
								? 'bg-secondary text-on-secondary'
								: 'bg-surface-container-lowest'}"
							onclick={() => (currentPage = page)}
						>
							{page}
						</button>
					{/if}
				{/each}
				<button
					class="h-7 px-2 bg-surface-container-lowest font-label-sm text-[10px] border-2 rounded-md border-on-background disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={currentPage === totalPages}
					onclick={() => currentPage++}
				>
					Next
				</button>
			</div>
		{/if}

		<div class="flex justify-end gap-sm pt-sm border-t-2 border-on-background/20">
			<Button variant="secondary" onclick={onCancel} class="text-xs py-1" disabled={isProcessing}
				>Batal</Button
			>
			<Button
				variant="info"
				onclick={() => onConfirm?.(rows)}
				class="text-xs py-1"
				disabled={isProcessing}
			>
				{#if isProcessing}
					Mengupload...
				{:else}
					<Icon name="upload" class="text-xs mr-1" fill={0} />
					Konfirmasi Upload ({totalItems} data)
				{/if}
			</Button>
		</div>
	{/if}
</div>
