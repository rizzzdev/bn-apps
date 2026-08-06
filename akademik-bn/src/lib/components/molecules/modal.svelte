<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Icon } from '$lib/components/atoms';

	let {
		children,
		footer,
		title = '',
		isOpen = $bindable(false),
		class: className = ''
	} = $props<{
		children?: Snippet;
		footer?: Snippet;
		title?: string;
		isOpen?: boolean;
		class?: string;
	}>();
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
		onclick={() => (isOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
		role="presentation"
	>
		<div
			class="bg-surface neo-border neo-shadow w-full max-w-lg my-auto max-h-[85dvh] flex flex-col overflow-hidden {className}"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div
				class="shrink-0 flex items-center justify-between gap-3 p-3 sm:p-4 neo-border-b bg-tertiary-fixed"
			>
				<h2 class="font-headline-md text-base sm:text-lg font-bold text-on-background min-w-0">
					{title}
				</h2>
				<button
					onclick={() => (isOpen = false)}
					class="shrink-0 hover:text-primary transition-colors"
				>
					<Icon name="close" />
				</button>
			</div>
			<div class="p-4 flex flex-col gap-sm overflow-y-auto">
				{@render children?.()}
			</div>
			{#if footer}
				<div
					class="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 p-4 neo-border-t bg-surface-container-low [&>button]:w-full [&>a]:w-full sm:[&>button]:w-auto sm:[&>a]:w-auto"
				>
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
