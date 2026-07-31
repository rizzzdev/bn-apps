<script lang="ts">
	import type { Snippet } from "svelte";
	import Icon from "$lib/components/atoms/icon.svelte";

	type TableVariant = "default" | "compact";

	let {
		loading = false,
		empty = false,
		emptyMessage = "Tidak ada data.",
		colSpan = 1,
		minWidth = "100%",
		variant = "default",
		children,
		header,
		loadingSnippet,
		emptySnippet,
	}: {
		loading?: boolean;
		empty?: boolean;
		emptyMessage?: string;
		colSpan?: number;
		minWidth?: string;
		variant?: TableVariant;
		children?: Snippet;
		header?: Snippet;
		loadingSnippet?: Snippet;
		emptySnippet?: Snippet;
	} = $props();
</script>

<div
	class="bg-surface border-2 border-on-background overflow-x-auto shadow-neo-sm animate-fade-in-up"
>
	<table
		class="w-full text-left border-collapse"
		style="min-width: {minWidth}"
	>
		{#if header}
			<thead>
				<tr
					class="border-b-2 border-on-background bg-slate-100 font-headline font-black uppercase text-xs tracking-wider"
				>
					{@render header()}
				</tr>
			</thead>
		{/if}
		<tbody>
			{#if loading}
				{#if loadingSnippet}
					{@render loadingSnippet()}
				{:else}
					<tr>
						<td
							colspan={colSpan}
							class="p-4 text-center font-mono text-secondary text-xs"
						>
							<Icon
								name="sync"
								class="text-base animate-spin text-primary inline-block mr-1"
							/>
							Loading...
						</td>
					</tr>
				{/if}
			{:else if empty}
				{#if emptySnippet}
					{@render emptySnippet()}
				{:else}
					<tr>
						<td
							colspan={colSpan}
							class="p-4 text-center font-mono text-secondary text-xs"
						>
							<Icon
								name="search_off"
								class="text-base mb-1 block mx-auto opacity-50"
							/>
							{emptyMessage}
						</td>
					</tr>
				{/if}
			{:else if children}
				{@render children()}
			{/if}
		</tbody>
	</table>
</div>
