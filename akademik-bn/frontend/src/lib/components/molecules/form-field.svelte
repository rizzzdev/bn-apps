<script lang="ts">
	import { Label, Input } from '$lib/components/atoms';

	let {
		id,
		label,
		value = $bindable(''),
		placeholder = '',
		type = 'text',
		error = '',
		class: className = ''
	} = $props<{
		id: string;
		label: string;
		value?: string;
		placeholder?: string;
		type?: string;
		error?: string;
		class?: string;
	}>();
</script>

<div class="flex flex-col gap-2 {className}">
	<Label for={id}>{label}</Label>
	<Input {id} bind:value {placeholder} {type} />
	{#if error}
		<p class="font-data-mono text-data-mono text-error">{error}</p>
	{/if}
</div>
