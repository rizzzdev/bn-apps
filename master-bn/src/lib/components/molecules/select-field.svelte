<script lang="ts">
	import { Label } from '$lib/components/atoms';
	import { Dropdown } from '$lib/components/molecules';

	let {
		id,
		label,
		value = $bindable(),
		options = [],
		placeholder = 'Pilih...',
		error = '',
		class: className = '',
		...rest
	} = $props<{
		id: string;
		label: string;
		value?: string | number;
		options: { value: string | number; label: string }[];
		placeholder?: string;
		error?: string;
		class?: string;
		[key: string]: unknown;
	}>();
</script>

<div class="flex flex-col mb-sm w-full {className}">
	<Label for={id}>{label}</Label>
	<Dropdown {options} {placeholder} bind:value variant="input" class="w-full" {...rest} />
	{#if error}
		<span class="text-error font-label-sm text-label-sm mt-xs">{error}</span>
	{/if}
</div>
