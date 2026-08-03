<script lang="ts">
	import { Icon, Input } from '$lib/components/atoms';

	let {
		value = $bindable(),
		placeholder = 'Pencarian Cepat...',
		class: className = ''
	} = $props<{
		value?: string;
		placeholder?: string;
		class?: string;
	}>();
</script>

<div
	class="px-sm border-on-background bg-on-primary flex items-center gap-2 border-3 rounded-lg h-8 {className}"
>
	<Icon name="search" class="text-on-surface text-base leading-none" />
	<Input bind:value {placeholder} class="h-full w-full border-none" />
</div>
