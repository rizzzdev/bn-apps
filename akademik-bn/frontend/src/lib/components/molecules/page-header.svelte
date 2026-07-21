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
	class="flex flex-col md:flex-row md:items-end justify-between gap-6 neo-border-b pb-6 mb-12 {className}"
>
	<div>
		<h1
			class="font-headline-lg text-xl sm:text-headline-xl text-primary font-black uppercase tracking-tighter"
		>
			{title}
		</h1>
		{#if description}
			<p class="font-data-mono text-data-mono text-on-surface-variant mt-2">{description}</p>
		{/if}
	</div>
	{#if children}
		<div class="flex gap-4 items-center">{@render children()}</div>
	{/if}
</div>
