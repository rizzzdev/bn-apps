<script lang="ts">
	let {
		page = $bindable(1),
		total,
		pageSize = 10,
		onPageChange
	}: {
		page: number;
		total: number;
		pageSize?: number;
		onPageChange?: (p: number) => void;
	} = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));

	function go(p: number) {
		if (p < 1 || p > totalPages) return;
		if (onPageChange) onPageChange(p);
		else page = p;
	}

	const visiblePages = $derived(
		Array.from({ length: totalPages }, (_, i) => i + 1).filter(
			(p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)
		)
	);
</script>

{#if totalPages > 1}
	<div class="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
		<span class="text-xs font-bold text-(--text-secondary)">
			Halaman {page} dari {totalPages}
		</span>

		<div class="flex items-center justify-center gap-1.5 flex-wrap">
			<!-- Prev -->
			<button onclick={() => go(page - 1)} disabled={page === 1} class="nb-page-btn"> ‹ </button>

			{#each visiblePages as p, i}
				{#if i > 0 && p - visiblePages[i - 1] > 1}
					<span class="px-1 font-black text-(--text-secondary) text-sm">…</span>
				{/if}
				<button onclick={() => go(p)} class={p === page ? 'nb-page-btn-active' : 'nb-page-btn'}>
					{p}
				</button>
			{/each}

			<!-- Next -->
			<button onclick={() => go(page + 1)} disabled={page === totalPages} class="nb-page-btn">
				›
			</button>
		</div>
	</div>
{/if}
