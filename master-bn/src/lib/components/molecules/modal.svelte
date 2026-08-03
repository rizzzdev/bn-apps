<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button, Icon } from '$lib/components/atoms';

	let {
		isOpen = $bindable(false),
		title,
		children,
		footer,
		class: className = ''
	} = $props<{
		isOpen?: boolean;
		title?: string;
		children?: Snippet;
		footer?: Snippet;
		class?: string;
	}>();
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/50 backdrop-blur-sm p-4"
	>
		<div
			class="bg-surface border-on-background w-[95vw] md:w-full md:max-w-4xl border-3 rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[90vh] {className}"
			role="dialog"
			aria-modal="true"
		>
			<div
				class="border-on-background p-md flex items-center justify-between border-b-3 bg-primary-container"
			>
				{#if title}
					<h2 class="font-headline-md text-headline-md tracking-tight uppercase text-on-surface">
						{title}
					</h2>
				{/if}
				<Button variant="icon" onclick={() => (isOpen = false)} aria-label="Tutup">
					<Icon name="close" class="text-on-surface" />
				</Button>
			</div>

			<div class="p-md overflow-y-auto">
				{@render children?.()}
			</div>

			{#if footer}
				<div
					class="border-on-background p-md bg-surface-variant flex items-center justify-end border-t-3 gap-sm"
				>
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
