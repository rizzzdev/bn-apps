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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={() => (isOpen = false)}
		onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
		role="presentation"
	>
		<div
			class="bg-surface neo-border neo-shadow w-full max-w-lg mx-4 {className}"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && (isOpen = false)}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="flex items-center justify-between p-6 neo-border-b bg-tertiary-fixed">
				<h2 class="font-headline-md text-headline-md font-bold text-on-background">
					{title}
				</h2>
				<button onclick={() => (isOpen = false)} class="hover:text-primary transition-colors">
					<Icon name="close" />
				</button>
			</div>
			<div class="p-6 flex flex-col gap-sm">
				{@render children?.()}
			</div>
			{#if footer}
				<div class="flex justify-end gap-3 p-6 neo-border-t bg-surface-container-low">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
