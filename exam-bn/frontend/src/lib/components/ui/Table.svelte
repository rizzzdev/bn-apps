<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		head,
		children,
		header,
		footer,
		class: className = ''
	}: {
		head: Snippet;
		children: Snippet;
		header?: Snippet;
		footer?: Snippet;
		class?: string;
	} = $props();
</script>

<div class="card overflow-hidden {className}">
	{#if header}
		{@render header()}
	{/if}
	<div class="overflow-x-auto">
		<table class="nb-table min-w-full text-left text-sm">
			<thead>
				{@render head()}
			</thead>
			<tbody>
				{@render children()}
			</tbody>
		</table>
	</div>
	{#if footer}
		{@render footer()}
	{/if}
</div>
