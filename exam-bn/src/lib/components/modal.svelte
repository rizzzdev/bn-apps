<script lang="ts">
	import { type Snippet } from 'svelte';

	let {
		show = false,
		onClose = () => {},
		children,
		size = 'md'
	}: {
		show?: boolean;
		onClose?: () => void;
		children?: Snippet;
		size?: 'sm' | 'md' | 'lg' | 'xl';
	} = $props();

	const sizeClass: Record<string, string> = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-2xl'
	};
</script>

{#if show}
	<div
		class="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="modal-panel w-full {sizeClass[size]} rounded-t sm:rounded max-h-[90svh] flex flex-col"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<!-- Drag indicator (mobile) -->
			<div class="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
				<div class="w-10 h-1 bg-(--nb-border)"></div>
			</div>
			<div class="overflow-y-auto p-5 sm:p-6 flex-1">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
