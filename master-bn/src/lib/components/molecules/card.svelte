<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		children,
		footer,
		class: className = ''
	} = $props<{
		title?: string;
		description?: string;
		children?: Snippet;
		footer?: Snippet;
		class?: string;
	}>();
</script>

<div
	class="bg-surface border-on-background p-md md:p-xl flex flex-col gap-md border-3 rounded-xl shadow-neo {className}"
>
	{#if title || description}
		<div class="flex flex-col gap-xs border-b-3 border-on-background pb-md">
			{#if title}
				<h3 class="font-headline-md text-headline-lg font-bold tracking-tighter text-on-surface">
					{title}
				</h3>
			{/if}
			{#if description}
				<p class="font-body-md text-body-md text-on-surface-variant">
					{description}
				</p>
			{/if}
		</div>
	{/if}

	{#if children}
		<div class="flex flex-col gap-md">
			{@render children()}
		</div>
	{/if}

	{#if footer}
		<div class="pt-md border-t-3 border-on-background mt-sm">
			{@render footer()}
		</div>
	{/if}
</div>
