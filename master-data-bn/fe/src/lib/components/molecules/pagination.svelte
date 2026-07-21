<script lang="ts">
	let {
		currentPage = 1,
		totalPages = 1,
		totalItems = 0,
		itemsPerPage = 10,
		onPageChange
	} = $props<{
		currentPage?: number;
		totalPages?: number;
		totalItems?: number;
		itemsPerPage?: number;
		onPageChange?: (page: number) => void;
	}>();

	let startItem = $derived((currentPage - 1) * itemsPerPage + 1);
	let endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	// Generate visible pages (simple version for now)
	let visiblePages = $derived(Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 3)); 
</script>

<div class="bg-surface-container p-md flex items-center justify-between border-3 border-on-background rounded-xl mt-md">
	<p class="font-body-base text-body-base text-on-surface-variant">
		Menampilkan {startItem}-{endItem} dari {totalItems} data
	</p>
	<div class="flex gap-xs">
		<button 
			class="h-10 px-sm bg-surface-container-lowest font-label-sm text-label-sm uppercase hover:bg-secondary hover:text-on-secondary transition-colors border-3 rounded-lg border-on-background shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={currentPage === 1}
			onclick={() => onPageChange?.(currentPage - 1)}
		>
			Prev
		</button>
		
		{#each visiblePages as page}
			<button 
				class="h-10 w-10 font-label-sm text-label-sm border-3 rounded-lg border-on-background transition-colors {currentPage === page ? 'bg-secondary text-on-secondary' : 'bg-surface-container-lowest hover:bg-surface-container-highest'} shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs active:translate-x-1 active:translate-y-1 active:shadow-none"
				onclick={() => onPageChange?.(page)}
			>
				{page}
			</button>
		{/each}

		{#if totalPages > 3}
			<span class="h-10 w-10 flex items-end justify-center pb-1">...</span>
		{/if}

		<button 
			class="h-10 px-sm bg-surface-container-lowest font-label-sm text-label-sm uppercase hover:bg-secondary hover:text-on-secondary transition-colors border-3 rounded-lg border-on-background shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={currentPage === totalPages}
			onclick={() => onPageChange?.(currentPage + 1)}
		>
			Next
		</button>
	</div>
</div>
