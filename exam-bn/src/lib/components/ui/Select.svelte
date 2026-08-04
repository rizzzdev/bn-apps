<script lang="ts">
	import type { Snippet } from 'svelte';
	import CustomSelect, { type SelectOption } from './CustomSelect.svelte';

	let {
		id,
		name,
		label,
		options = [],
		value = $bindable(undefined),
		multiple = false,
		required = false,
		disabled = false,
		searchable,
		searchThreshold = 10,
		placeholder,
		class: className = '',
		hint,
		children,
		onchange
	}: {
		id?: string;
		name?: string;
		label?: string;
		options?: SelectOption[];
		value?: any;
		multiple?: boolean;
		required?: boolean;
		disabled?: boolean;
		searchable?: boolean;
		searchThreshold?: number;
		placeholder?: string;
		class?: string;
		hint?: string;
		children?: Snippet;
		onchange?: (val: any) => void;
	} = $props();
</script>

{#if options && options.length > 0}
	<CustomSelect
		{id}
		{name}
		{label}
		{options}
		bind:value
		{multiple}
		{required}
		{disabled}
		{searchable}
		{searchThreshold}
		{placeholder}
		{hint}
		class={className}
		{onchange}
	/>
{:else}
	<div class={className}>
		{#if label}
			<label for={id} class="block text-sm font-bold text-(--text-primary) mb-1">
				{label}{required ? ' *' : ''}
			</label>
		{/if}
		<select {id} {name} {required} {disabled} bind:value class="input-field">
			{#if children}
				{@render children()}
			{/if}
		</select>
		{#if hint}
			<p class="mt-1 text-xs text-(--text-secondary)">{hint}</p>
		{/if}
	</div>
{/if}
