<script lang="ts">
	let {
		currentPage = $bindable(1),
		totalPages = 1,
		totalItems = 0,
		itemsPerPage = 10,
		onPageChange
	} = $props<{
		currentPage?: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage?: number;
		onPageChange?: (page: number) => void;
	}>();

	let startItem = $derived((currentPage - 1) * itemsPerPage + 1);
	let endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	let pages = $derived.by(() => {
		const p: number[] = [];
		for (let i = 1; i <= totalPages; i++) {
			p.push(i);
		}
		return p;
	});

	function goTo(page: number) {
		if (page < 1 || page > totalPages) return;
		currentPage = page;
		onPageChange?.(page);
	}
</script>

<div class="flex justify-between items-center font-data-mono text-data-mono">
	<span class="bg-surface-container neo-border px-3 py-1">
		Menampilkan {startItem}-{endItem} dari {totalItems}
	</span>
	<div class="flex gap-2">
		<button
			disabled={currentPage <= 1}
			onclick={() => goTo(currentPage - 1)}
			class="neo-border w-10 h-10 flex items-center justify-center bg-surface-container-highest hover:bg-secondary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
		>
			&lt;
		</button>
		{#each pages as page}
			<button
				onclick={() => goTo(page)}
				class="neo-border w-10 h-10 flex items-center justify-center font-bold transition-colors {page ===
				currentPage
					? 'bg-primary text-on-primary'
					: 'bg-surface-container-highest hover:bg-secondary-container'}"
			>
				{page}
			</button>
		{/each}
		<button
			disabled={currentPage >= totalPages}
			onclick={() => goTo(currentPage + 1)}
			class="neo-border w-10 h-10 flex items-center justify-center bg-surface-container-highest hover:bg-secondary-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
		>
			&gt;
		</button>
	</div>
</div>
