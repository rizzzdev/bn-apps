<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		actions
	} = $props<{
		title: string;
		description?: string;
		actions?: Snippet;
	}>();
</script>

<div class="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
	<div>
		<h2 class="font-display-lg text-display-lg text-on-surface mb-xs uppercase tracking-tight">
			{title}
		</h2>
		{#if description}
			<p class="font-body-base text-body-base text-on-surface-variant max-w-2xl">
				{description}
			</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex gap-sm">
			{@render actions()}
		</div>
	{/if}
</div>
