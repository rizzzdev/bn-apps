<script lang="ts">
	import { Icon } from '$lib/components/atoms';

	let {
		loading = false,
		isEmpty = false,
		loadingMessage = 'Memuat data...',
		emptyIcon = 'inbox',
		emptyTitle = '',
		emptyMessage = 'Tidak ada data yang tersedia.',
		class: className = ''
	}: {
		loading?: boolean;
		isEmpty?: boolean;
		loadingMessage?: string;
		emptyIcon?: string;
		emptyTitle?: string;
		emptyMessage?: string;
		class?: string;
	} = $props();
</script>

{#if loading}
	<div class="border-2 border-on-background bg-surface shadow-neo-sm p-5 text-center {className}">
		<Icon name="sync" class="text-lg text-primary animate-spin mx-auto mb-1" />
		<p class="font-mono text-[10px] text-secondary">{loadingMessage}</p>
	</div>
{:else if isEmpty}
	<div class="border-2 border-on-background bg-surface shadow-neo-sm p-5 text-center {className}">
		<Icon name={emptyIcon} class="text-lg text-secondary mb-1 block mx-auto" />
		{#if emptyTitle}
			<h3 class="font-headline text-sm font-black uppercase mb-1">{emptyTitle}</h3>
		{/if}
		<p class="font-mono text-[10px] text-secondary">{emptyMessage}</p>
	</div>
{/if}
