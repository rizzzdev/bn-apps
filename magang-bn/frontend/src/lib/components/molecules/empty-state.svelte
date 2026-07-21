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
	<div class="border-4 border-on-background bg-surface shadow-neo p-8 text-center {className}">
		<Icon name="sync" class="text-4xl text-primary animate-spin mx-auto mb-2" />
		<p class="font-mono text-secondary">{loadingMessage}</p>
	</div>
{:else if isEmpty}
	<div class="border-4 border-on-background bg-surface shadow-neo p-12 text-center {className}">
		<Icon name={emptyIcon} class="text-6xl text-secondary mb-4 block mx-auto" />
		{#if emptyTitle}
			<h3 class="font-headline text-2xl font-black uppercase mb-2">{emptyTitle}</h3>
		{/if}
		<p class="font-mono text-secondary">{emptyMessage}</p>
	</div>
{/if}
