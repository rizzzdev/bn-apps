<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		name,
		label,
		value = $bindable(''),
		required = false,
		disabled = false,
		class: className = '',
		hint,
		children
	}: {
		id?: string;
		name?: string;
		label?: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
		hint?: string;
		children: Snippet;
	} = $props();
</script>

<div class={className}>
	{#if label}
		<label for={id} class="block text-sm font-bold text-(--text-primary) mb-1">
			{label}{required ? ' *' : ''}
		</label>
	{/if}
	<select {id} {name} {required} {disabled} bind:value class="input-field">
		{@render children()}
	</select>
	{#if hint}
		<p class="mt-1 text-xs text-(--text-secondary)">{hint}</p>
	{/if}
</div>
