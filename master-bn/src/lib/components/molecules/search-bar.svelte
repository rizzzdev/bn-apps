<script lang="ts">
	import { Icon, Input } from '$lib/components/atoms';

	let {
		value = $bindable(''),
		placeholder = 'Pencarian Cepat...',
		class: className = '',
		debounceTime = 500
	} = $props<{
		value?: string;
		placeholder?: string;
		class?: string;
		debounceTime?: number;
	}>();

	let searchValue = $state(value ?? '');
	let isTyping = false;

	// Sync when value is changed externally (e.g. clear/reset)
	$effect(() => {
		if (!isTyping && value !== searchValue) {
			searchValue = value ?? '';
		}
	});

	// Debounce updating the bound prop value
	$effect(() => {
		const current = searchValue;
		isTyping = true;
		const timer = setTimeout(() => {
			value = current;
			isTyping = false;
		}, debounceTime);

		return () => {
			clearTimeout(timer);
		};
	});
</script>

<div
	class="px-sm border-on-background bg-on-primary flex items-center gap-2 border-3 rounded-lg h-8 {className}"
>
	<Icon name="search" class="text-on-surface text-base leading-none" />
	<Input bind:value={searchValue} {placeholder} class="h-full w-full border-none" />
</div>
