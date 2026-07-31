<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description = '',
		children,
		class: className = ''
	} = $props<{
		title: string;
		description?: string;
		children?: Snippet;
		class?: string;
	}>();
</script>

<div
	class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-3 pb-4 {className}"
>
	<div>
		<h1 class="font-headline-lg text-3xl text-primary font-black uppercase tracking-tighter">
			{title}
		</h1>
		{#if description}
			<p class="font-data-mono text-xs text-on-surface-variant">{description}</p>
		{/if}
	</div>
	{#if children}
		<div class="flex gap-4 items-center">{@render children()}</div>
	{/if}
</div>
