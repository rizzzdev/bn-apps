<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		for: htmlFor,
		required = false,
		hint,
		error,
		class: className = '',
		children
	}: {
		label?: string;
		for?: string;
		required?: boolean;
		hint?: string;
		error?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div class={className}>
	{#if label}
		<label for={htmlFor} class="block text-sm font-bold text-(--text-primary) mb-1">
			{label}{required ? ' *' : ''}
		</label>
	{/if}
	{@render children()}
	{#if error}
		<p class="mt-1 text-xs font-bold text-red-600">{error}</p>
	{:else if hint}
		<p class="mt-1 text-xs text-(--text-secondary)">{hint}</p>
	{/if}
</div>
