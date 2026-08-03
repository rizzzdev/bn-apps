<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, description, actions } = $props<{
		title: string;
		description?: string;
		actions?: Snippet;
	}>();
</script>

<div class="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
	<div>
		<h2
			class="font-display-lg text-xl md:text-2xl font-black text-on-surface mb-0.5 uppercase tracking-tight"
		>
			{title}
		</h2>
		{#if description}
			<p class="font-body-base text-xs text-on-surface-variant max-w-2xl">
				{description}
			</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex gap-2 items-center flex-wrap">
			{@render actions()}
		</div>
	{/if}
</div>
