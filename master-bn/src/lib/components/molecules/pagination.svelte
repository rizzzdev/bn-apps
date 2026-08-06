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
	class="bg-surface-container p-md flex flex-col gap-3 border-3 border-on-background rounded-xl mt-md md:flex-row md:items-center md:justify-between"
>
	<p class="font-body-base text-body-base text-on-surface-variant text-center md:text-left">
		Menampilkan {startItem}-{endItem} dari {totalItems} data
	</p>
	<div class="flex flex-wrap items-center justify-center gap-xs md:gap-sm">
		<button
			class="h-8 px-sm bg-surface-container-lowest font-label-sm text-xs uppercase hover:bg-secondary hover:text-on-secondary transition-colors border-3 rounded-lg border-on-background shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed md:h-10 md:px-md md:text-sm"
			disabled={currentPage === 1}
			onclick={() => onPageChange?.(currentPage - 1)}
		>
			Prev
		</button>

		{#each visiblePages as page (typeof page === 'string' ? page : page)}
			{#if typeof page === 'string'}
				<span class="h-8 w-8 md:h-10 md:w-10 flex items-end justify-center pb-1">...</span>
			{:else}
				<button
					class="h-8 w-8 md:h-10 md:w-10 font-label-sm text-xs border-3 rounded-lg border-on-background transition-colors md:text-sm {currentPage ===
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
			class="h-8 px-sm bg-surface-container-lowest font-label-sm text-xs uppercase hover:bg-secondary hover:text-on-secondary transition-colors border-3 rounded-lg border-on-background shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed md:h-10 md:px-md md:text-sm"
			disabled={currentPage === totalPages}
			onclick={() => onPageChange?.(currentPage + 1)}
		>
			Next
		</button>
	</div>
</div>
