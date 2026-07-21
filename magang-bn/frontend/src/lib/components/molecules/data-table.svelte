<script lang="ts">
	import { Icon, ActionButton, Button } from '$lib/components/atoms';
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

<div class="mb-6 relative z-10 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<SearchFilter bind:searchQuery {onSearch} placeholder="Cari..." />

	{#if filters.length > 0}
		<div class="flex flex-col md:flex-row gap-4 mt-4 w-full">
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

<div class="border-4 border-on-background bg-surface overflow-x-auto shadow-neo animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<table class="w-full text-left border-collapse min-w-[600px]">
		<thead>
			<tr class="border-b-4 border-on-background bg-slate-100 font-headline font-black uppercase text-sm">
				{#each columns as col}
					<th class="p-4 {col.width ? 'w-[' + col.width + ']' : ''} {col.align === 'center' ? 'text-center' : ''} {!col.key || columns.indexOf(col) < columns.length - 1 ? 'border-r-4 border-on-background' : ''}">
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if loading}
				<tr>
					<td colspan={columns.length} class="p-8 text-center">
						<Icon name="sync" class="text-4xl animate-spin text-primary" />
					</td>
				</tr>
			{:else if rows.length === 0}
				<tr>
					<td colspan={columns.length} class="p-8 text-center font-mono font-bold text-secondary">
						<Icon name="search_off" class="text-4xl mb-2 block mx-auto opacity-50" />
						Tidak ada data
					</td>
				</tr>
			{:else}
				{#each rows as row, i}
					<tr class="border-b-4 border-on-background hover:bg-slate-50 transition-colors font-mono text-sm last:border-b-0">
						{#each columns as col}
							<td class="p-4 {col.align === 'center' ? 'text-center' : ''} {!col.key === columns.indexOf(col) < columns.length - 1 ? 'border-r-4 border-on-background' : ''}">
								{col.render ? col.render(row) : row[col.key] ?? '-'}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

{#if !loading && totalPages > 1}
	<div class="mt-6 flex justify-end animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
		<Pagination bind:currentPage {totalPages} />
	</div>
{/if}