<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		id,
		name,
		type = 'text',
		label,
		placeholder = '',
		value = $bindable(''),
		required = false,
		disabled = false,
		autocomplete,
		class: className = '',
		hint,
		oninput
	}: {
		id?: string;
		name?: string;
		type?: string;
		label?: string;
		placeholder?: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		class?: string;
		hint?: string;
		oninput?: (e: Event) => void;
	} = $props();
</script>

<div class={className}>
	{#if label}
		<label for={id} class="block text-sm font-bold text-(--text-primary) mb-1">
			{label}{required ? ' *' : ''}
		</label>
	{/if}
	<input
		{id}
		{name}
		{type}
		{placeholder}
		{required}
		{disabled}
		{autocomplete}
		{oninput}
		bind:value
		class="input-field"
	/>
	{#if hint}
		<p class="mt-1 text-xs text-(--text-secondary)">{hint}</p>
	{/if}
</div>
