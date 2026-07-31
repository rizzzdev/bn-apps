<script lang="ts">
	import { Icon } from '../atoms';

	let { 
		currentPage = $bindable(1), 
		totalPages = 1, 
		onPageChange 
	} = $props<{ 
		currentPage?: number; 
		totalPages: number; 
		onPageChange?: (page: number) => void;
	}>();

	const handlePageChange = (page: number) => {
		if (page < 1 || page > totalPages || page === currentPage) return;
		currentPage = page;
		if (onPageChange) {
			onPageChange(page);
		}
	};

	let pages = $derived.by(() => {
		const p: (number | string)[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) p.push(i);
		} else {
			if (currentPage <= 4) {
				p.push(1, 2, 3, 4, 5, '...', totalPages);
			} else if (currentPage >= totalPages - 3) {
				p.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
			} else {
				p.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
			}
		}
		return p;
	});
</script>

{#if totalPages > 0}
	<div class="flex items-center gap-1">
		<!-- Prev Button -->
		<button
			class="p-1 border border-on-background shadow-[1px_1px_0px_0px_#0f172a] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[1px_1px_0px_0px_#0f172a] bg-surface text-on-background"
			disabled={currentPage === 1}
			onclick={() => handlePageChange(currentPage - 1)}
			aria-label="Previous Page"
		>
			<Icon name="chevron_left" class="text-[10px]" />
		</button>
		
		<!-- Page Numbers -->
<div class="flex items-center gap-0.5">
			{#each pages as page, i (i)}
				{#if page === '...'}
					<span class="w-5 flex items-center justify-center font-bold text-on-background opacity-50 px-0.5">...</span>
				{:else}
					<button
						class="min-w-[24px] h-[24px] px-1 flex items-center justify-center border border-on-background shadow-[1px_1px_0px_0px_#0f172a] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all font-bold font-mono text-[10px] leading-none
						{currentPage === page ? 'bg-primary text-surface' : 'bg-surface text-on-background'}"
						onclick={() => handlePageChange(page as number)}
					>
						{page}
					</button>
				{/if}
			{/each}
		</div>

		<!-- Next Button -->
		<button
			class="p-1 border border-on-background shadow-[1px_1px_0px_0px_#0f172a] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[1px_1px_0px_0px_#0f172a] bg-surface text-on-background"
			disabled={currentPage === totalPages}
			onclick={() => handlePageChange(currentPage + 1)}
			aria-label="Next Page"
		>
			<Icon name="chevron_right" class="text-[10px]" />
		</button>
	</div>
{/if}
