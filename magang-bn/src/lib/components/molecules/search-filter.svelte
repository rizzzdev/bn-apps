<script lang="ts">
	import { Icon, Input, Button } from '../atoms';

	let { 
		searchQuery = $bindable(''), 
		placeholder = 'Cari...',
		debounceMs = 500,
		onSearch = () => {},
		children
	} = $props<{
		searchQuery?: string;
		placeholder?: string;
		debounceMs?: number;
		onSearch?: () => void;
		children?: import('svelte').Snippet;
	}>();

	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	function handleInput() {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			onSearch();
		}, debounceMs);
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (timeoutId) clearTimeout(timeoutId);
		onSearch();
	}
</script>

<div class="flex flex-col md:flex-row gap-3 mb-4 items-center">
	<form class="flex-1 w-full" onsubmit={handleSubmit}>
		<Input 
			type="text" 
			id="search_query" 
			bind:value={searchQuery}
			oninput={handleInput}
			{placeholder} 
			icon="search"
		/>
	</form>
	
	{#if children}
		<div class="flex gap-2 items-center w-full md:w-auto">
			{@render children()}
		</div>
	{/if}
</div>
