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
	<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
		<!-- Info -->
		<span
			class="self-start bg-surface border border-on-background shadow-[1px_1px_0px_0px_#0f172a] px-2.5 py-1 text-[11px] md:self-auto md:text-sm"
		>
			Halaman {currentPage} dari {totalPages}
		</span>

		<!-- Controls -->
		<div class="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
			<!-- Prev Button -->
			<button
				class="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border border-on-background shadow-[1px_1px_0px_0px_#0f172a] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[1px_1px_0px_0px_#0f172a] bg-surface text-on-background"
				disabled={currentPage === 1}
				onclick={() => handlePageChange(currentPage - 1)}
				aria-label="Halaman sebelumnya"
			>
				<Icon name="chevron_left" class="text-sm md:text-base" />
			</button>

			<!-- Page Numbers -->
			{#each pages as page, i (i)}
				{#if page === '...'}
					<span
						class="w-8 md:w-10 h-8 md:h-10 flex items-center justify-center font-bold text-on-background opacity-50 text-sm md:text-base"
						>...</span
					>
				{:else}
					<button
						class="min-w-[32px] md:min-w-[40px] h-8 md:h-10 px-1.5 flex items-center justify-center border border-on-background shadow-[1px_1px_0px_0px_#0f172a] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all font-bold font-mono text-xs md:text-sm leading-none
						{currentPage === page ? 'bg-primary text-surface' : 'bg-surface text-on-background'}"
						onclick={() => handlePageChange(page as number)}
					>
						{page}
					</button>
				{/if}
			{/each}

			<!-- Next Button -->
			<button
				class="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border border-on-background shadow-[1px_1px_0px_0px_#0f172a] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[1px_1px_0px_0px_#0f172a] bg-surface text-on-background"
				disabled={currentPage === totalPages}
				onclick={() => handlePageChange(currentPage + 1)}
				aria-label="Halaman berikutnya"
			>
				<Icon name="chevron_right" class="text-sm md:text-base" />
			</button>
		</div>
	</div>
{/if}
