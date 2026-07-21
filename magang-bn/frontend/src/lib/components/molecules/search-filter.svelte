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

<div class="flex flex-col md:flex-row gap-3 mb-6 bg-slate-50 p-4 border-4 border-on-background shadow-neo">
	<form class="flex-1 flex gap-2" onsubmit={handleSubmit}>
		<div class="flex-1">
			<Input 
				type="text" 
				id="search_query" 
				bind:value={searchQuery}
				oninput={handleInput}
				{placeholder} 
				icon="search"
			/>
		</div>
	</form>
	
	{#if children}
		<div class="flex gap-2 items-center border-t-4 border-on-background pt-3 md:border-t-0 md:pt-0 md:border-l-4 md:pl-3">
			{@render children()}
		</div>
	{/if}
</div>
