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

	let visiblePages = $derived.by(() => {
		const pages: (number | string)[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
		} else {
			pages.push(1);
			if (currentPage > 3) pages.push('...');
			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);
			for (let i = start; i <= end; i++) pages.push(i);
			if (currentPage < totalPages - 2) pages.push('...');
			pages.push(totalPages);
		}
		return pages;
	});
</script>

<div
	class="bg-surface-container p-md flex items-center justify-between border-3 border-on-background rounded-xl mt-md"
>
	<p class="font-body-base text-body-base text-on-surface-variant">
		Menampilkan {startItem}-{endItem} dari {totalItems} data
	</p>
	<div class="flex gap-xs">
		<button
			class="h-8 px-sm bg-surface-container-lowest font-label-sm text-xs uppercase hover:bg-secondary hover:text-on-secondary transition-colors border-3 rounded-lg border-on-background shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={currentPage === 1}
			onclick={() => onPageChange?.(currentPage - 1)}
		>
			Prev
		</button>

		{#each visiblePages as page (typeof page === 'string' ? page : page)}
			{#if typeof page === 'string'}
				<span class="h-8 w-8 flex items-end justify-center pb-1">...</span>
			{:else}
				<button
					class="h-8 w-8 font-label-sm text-xs border-3 rounded-lg border-on-background transition-colors {currentPage ===
					page
						? 'bg-secondary text-on-secondary'
						: 'bg-surface-container-lowest hover:bg-surface-container-highest'} shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs active:translate-x-1 active:translate-y-1 active:shadow-none"
					onclick={() => onPageChange?.(page)}
				>
					{page}
				</button>
			{/if}
		{/each}

		<button
			class="h-8 px-sm bg-surface-container-lowest font-label-sm text-xs uppercase hover:bg-secondary hover:text-on-secondary transition-colors border-3 rounded-lg border-on-background shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={currentPage === totalPages}
			onclick={() => onPageChange?.(currentPage + 1)}
		>
			Next
		</button>
	</div>
</div>
