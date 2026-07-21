<script lang="ts">
	let {
		id,
		name,
		label,
		placeholder = '',
		value = $bindable(''),
		required = false,
		disabled = false,
		rows = 4,
		resize = false,
		class: className = '',
		hint
	}: {
		id?: string;
		name?: string;
		label?: string;
		placeholder?: string;
		value?: string;
		required?: boolean;
		disabled?: boolean;
		rows?: number;
		resize?: boolean;
		class?: string;
		hint?: string;
	} = $props();
</script>

<div class={className}>
	{#if label}
		<label for={id} class="block text-sm font-bold text-(--text-primary) mb-1">
			{label}{required ? ' *' : ''}
		</label>
	{/if}
	<textarea
		{id}
		{name}
		{placeholder}
		{required}
		{disabled}
		{rows}
		bind:value
		class="input-field {resize ? '' : 'resize-none'}"
	></textarea>
	{#if hint}
		<p class="mt-1 text-xs text-(--text-secondary)">{hint}</p>
	{/if}
</div>
