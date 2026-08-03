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

<div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t-2 border-black">
	<div class="font-label-bold text-xs text-secondary">
		Menampilkan <span class="text-on-surface font-black">{startItem} - {endItem}</span> dari <span class="text-on-surface font-black">{totalItems}</span> data
	</div>

	<!-- Pagination Controls (Sistem Truncation Otomatis untuk Halaman Banyak) -->
	<div class="flex items-center gap-1.5 flex-wrap">
		<!-- Previous Button -->
		<button
			type="button"
			disabled={currentPage <= 1}
			onclick={() => onPageChange(currentPage - 1)}
			class="px-2.5 py-1.5 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center font-bold"
			title="Halaman Sebelumnya"
		>
			<span class="material-symbols-outlined text-sm">chevron_left</span>
		</button>

		<!-- Page Numbers / Ellipsis -->
		{#each visiblePages as item}
			{#if item === '...'}
				<span class="min-w-[32px] h-[32px] px-2 py-1 border-2 border-black bg-surface-container font-label-bold text-xs flex items-center justify-center select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
					...
				</span>
			{:else}
				<button
					type="button"
					onclick={() => onPageChange(item)}
					class="min-w-[32px] h-[32px] px-2 py-1 border-2 border-black font-label-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center {currentPage === item
						? 'bg-primary text-on-primary font-black scale-105'
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
			class="px-2.5 py-1.5 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center font-bold"
			title="Halaman Selanjutnya"
		>
			<span class="material-symbols-outlined text-sm">chevron_right</span>
		</button>
	</div>
</div>
