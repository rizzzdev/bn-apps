<script lang="ts">
	import { Icon } from '$lib/components/atoms';

	let {
		value = $bindable(),
		options = [],
		placeholder = 'Pilih...',
		class: className = '',
		...rest
	} = $props<{
		value?: string | number;
		options: { value: string | number; label: string }[];
		placeholder?: string;
		class?: string;
		[key: string]: unknown;
	}>();
</script>

<div class="relative inline-flex items-center {className}">
	<select
		bind:value
		class="w-full appearance-none border-3 border-on-background bg-surface-container-lowest py-xs pl-sm pr-xl font-label-sm text-label-sm text-on-surface outline-none rounded-lg transition-all cursor-pointer uppercase"
		{...rest}
	>
		{#if placeholder}
			<option value="" disabled selected>{placeholder}</option>
		{/if}
		{#each options as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
	<Icon name="arrow_drop_down" class="absolute right-2 pointer-events-none text-on-surface" fill={1} />
</div>
