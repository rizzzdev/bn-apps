<script lang="ts">
	import { Icon, ActionButton, Button } from '$lib/components/atoms';
	import { Table } from '$lib/components/molecules';
	import Pagination from './pagination.svelte';
	import SearchFilter from './search-filter.svelte';
	import Select from './select.svelte';
	import type { SelectOption } from '$lib/types';

		type FilterDef = { key: string; options: SelectOption[]; bindable: any; placeholder?: string };

		let {
		loading = false,
		columns = [],
		rows = [],
		totalPages = 1,
		currentPage = $bindable(1),
		searchQuery = $bindable(''),
		onSearch,
		filters = [],
	}: {
		loading: boolean;
		columns: { key: string; label: string; width?: string; align?: string; render?: (row: any) => any }[];
		rows: any[];
		totalPages: number;
		currentPage: number;
		searchQuery: string;
		onSearch: () => void;
		filters?: FilterDef[];
	} = $props();

	let filterWrappers: { value: any; onChange: (v: any) => void }[] = [];
	$effect(() => {
		filterWrappers = filters.map((f: FilterDef) => ({
			get value() { return f.bindable; },
			set value(v) { /* handled by parent $bindable */ },
			onChange: (v: any) => {},
		}));
	});
</script>

<div class="mb-4 relative z-10 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<SearchFilter bind:searchQuery {onSearch} placeholder="Cari..." />

	{#if filters.length > 0}
		<div class="flex flex-col md:flex-row gap-3 mt-3 w-full">
			{#each filters as filter}
				<div class="w-full md:w-56">
					<Select
						bind:value={filter.bindable}
						options={filter.options}
						searchable={filter.options.length > 8}
						placeholder={filter.placeholder ?? 'Semua'}
					/>
				</div>
			{/each}
		</div>
	{/if}
</div>

<Table loading={loading} empty={rows.length === 0} colSpan={columns.length} minWidth="600px" emptyMessage="Tidak ada data">
	{#snippet header()}
		{#each columns as col}
			<th class="p-3 {col.width ? 'w-[' + col.width + ']' : ''} {col.align === 'center' ? 'text-center' : ''} {!col.key || columns.indexOf(col) < columns.length - 1 ? 'border-r-2 border-on-background' : ''}">
				{col.label}
			</th>
		{/each}
	{/snippet}
	{#snippet loadingSnippet()}
		<tr>
			<td colspan={columns.length} class="p-5 text-center">
				<Icon name="sync" class="text-lg animate-spin text-primary" />
			</td>
		</tr>
	{/snippet}
	{#snippet emptySnippet()}
		<tr>
			<td colspan={columns.length} class="p-5 text-center font-mono font-bold text-secondary">
				<Icon name="search_off" class="text-lg mb-1 block mx-auto opacity-50" />
				Tidak ada data
			</td>
		</tr>
	{/snippet}
	{#each rows as row, i}
		<tr class="border-b-2 border-on-background hover:bg-slate-50 transition-colors font-mono text-xs last:border-b-0">
			{#each columns as col}
				<td class="p-3 {col.align === 'center' ? 'text-center' : ''} {!col.key === columns.indexOf(col) < columns.length - 1 ? 'border-r-2 border-on-background' : ''}">
					{col.render ? col.render(row) : row[col.key] ?? '-'}
				</td>
			{/each}
		</tr>
	{/each}
</Table>

{#if !loading && totalPages > 1}
	<div class="mt-4 flex justify-end animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}