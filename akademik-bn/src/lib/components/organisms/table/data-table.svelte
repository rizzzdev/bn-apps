<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		isLoading = false,
		error = '',
		isEmpty = false,
		emptyMessage = 'Belum ada data',
		loadingMessage = 'Memuat data...',
		class: className = '',
		children
	}: {
		isLoading?: boolean;
		error?: string;
		isEmpty?: boolean;
		emptyMessage?: string;
		loadingMessage?: string;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

{#if isLoading}
	<div class="neo-border neo-shadow bg-surface p-8 text-center font-data-mono text-data-mono">
		{loadingMessage}
	</div>
{:else if error}
	<div class="neo-border bg-error-container text-error p-4 font-data-mono text-data-mono">
		{error}
	</div>
{:else if isEmpty}
	<div
		class="neo-border neo-shadow bg-surface p-10 text-center font-body-md text-body-md text-on-surface-variant"
	>
		<p>{emptyMessage}</p>
	</div>
{:else if children}
	<div class="w-full overflow-x-auto border-2 neo-shadow-sm bg-surface {className}">
		{@render children()}
	</div>
{/if}
