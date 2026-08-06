<script lang="ts">
	let {
		currentPage = 1,
		totalPages = 1,
		totalItems = 0,
		itemsPerPage = 6,
		onPageChange
	}: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage?: number;
		onPageChange: (page: number) => void;
	} = $props();

	let startItem = $derived(totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1);
	let endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	// Smart Pagination truncation algorithm for large page counts
	let visiblePages = $derived(
		(() => {
			const total = Math.max(1, totalPages);
			if (total <= 7) {
				return Array.from({ length: total }, (_, i) => i + 1);
			}

			const pages: (number | '...')[] = [];

			if (currentPage <= 4) {
				pages.push(1, 2, 3, 4, 5, '...', total);
			} else if (currentPage >= total - 3) {
				pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
			} else {
				pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total);
			}

			return pages;
		})()
	);
</script>

<div
	class="mt-8 flex flex-col items-center justify-between gap-4 border-t-2 border-black pt-4 sm:flex-row"
>
	<div class="text-center font-label-bold text-xs text-secondary sm:text-left">
		Menampilkan <span class="font-black text-on-surface">{startItem} - {endItem}</span> dari
		<span class="font-black text-on-surface">{totalItems}</span> data
	</div>

	<!-- Pagination Controls (Sistem Truncation Otomatis untuk Halaman Banyak) -->
	<div class="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
		<!-- Previous Button -->
		<button
			type="button"
			disabled={currentPage <= 1}
			onclick={() => onPageChange(currentPage - 1)}
			class="flex items-center justify-center border-2 border-black bg-white px-2.5 py-1.5 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40 md:px-3 md:py-2"
			title="Halaman Sebelumnya"
		>
			<span class="material-symbols-outlined text-sm md:text-base">chevron_left</span>
		</button>

		<!-- Page Numbers / Ellipsis -->
		{#each visiblePages as item}
			{#if item === '...'}
				<span
					class="flex h-[32px] min-w-[32px] items-center justify-center border-2 border-black bg-surface-container px-2 py-1 font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] select-none md:h-[40px] md:min-w-[40px] md:text-sm"
				>
					...
				</span>
			{:else}
				<button
					type="button"
					onclick={() => onPageChange(item)}
					class="flex h-[32px] min-w-[32px] items-center justify-center border-2 border-black px-2 py-1 font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all md:h-[40px] md:min-w-[40px] md:text-sm {currentPage ===
					item
						? 'scale-105 bg-primary font-black text-on-primary'
						: 'bg-white text-on-surface hover:bg-surface-container-high'}"
				>
					{item}
				</button>
			{/if}
		{/each}

		<!-- Next Button -->
		<button
			type="button"
			disabled={currentPage >= totalPages}
			onclick={() => onPageChange(currentPage + 1)}
			class="flex items-center justify-center border-2 border-black bg-white px-2.5 py-1.5 font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40 md:px-3 md:py-2"
			title="Halaman Selanjutnya"
		>
			<span class="material-symbols-outlined text-sm md:text-base">chevron_right</span>
		</button>
	</div>
</div>
