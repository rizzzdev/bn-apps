<script lang="ts">
	import { Icon } from '$lib/components/atoms';

	let {
		value = $bindable(''),
		placeholder = 'Cari...',
		debounceMs = 300,
		onSearch,
		class: className = ''
	} = $props<{
		value?: string;
		placeholder?: string;
		debounceMs?: number;
		onSearch?: (term: string) => void;
		class?: string;
	}>();

	let internalValue = $state(value);
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		internalValue = value;
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		internalValue = target.value;

		if (timer) clearTimeout(timer);
		timer = setTimeout(() => {
			value = internalValue;
			if (onSearch) onSearch(internalValue);
		}, debounceMs);
	}
</script>

<div
	class="h-8 neo-border neo-shadow-sm bg-surface-container-highest flex items-center gap-2 px-4 {className}"
>
	<Icon name="search" size="20px" />
	<input
		value={internalValue}
		oninput={handleInput}
		{placeholder}
		class="bg-transparent border-none focus:ring-0 font-data-mono text-xs outline-none w-full placeholder:text-on-surface-variant"
	/>
</div>
