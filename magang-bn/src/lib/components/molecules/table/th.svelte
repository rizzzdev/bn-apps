<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type ThVariant = 'default' | 'compact' | 'action' | 'checkbox';
	type Align = 'left' | 'center' | 'right';

	interface Props extends HTMLAttributes<HTMLTableCellElement> {
		bordered?: boolean;
		align?: Align;
		variant?: ThVariant;
		width?: string;
		colspan?: number;
		colSpan?: number;
		rowspan?: number;
		rowSpan?: number;
		children?: Snippet;
	}

	let {
		bordered = true,
		align = 'left',
		variant = 'default',
		width,
		colspan,
		colSpan,
		rowspan,
		rowSpan,
		children,
		...rest
	}: Props = $props();

	let finalColSpan = $derived(colSpan ?? colspan);
	let finalRowSpan = $derived(rowSpan ?? rowspan);

	let alignClass = $derived(
		align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
	);

	let variantClasses = $derived.by(() => {
		switch (variant) {
			case 'checkbox':
				return 'w-8 text-center p-2.5';
			case 'action':
				return 'text-center p-2.5';
			case 'compact':
				return 'p-1.5 text-xs';
			default:
				return 'p-2.5 text-xs';
		}
	});
</script>

<th
	colSpan={finalColSpan}
	rowSpan={finalRowSpan}
	class="font-headline font-black uppercase tracking-wider {bordered ? 'border-r-2 border-on-background' : ''} {alignClass} {variantClasses} {width || ''}"
	{...rest}
>
	{#if children}{@render children()}{/if}
</th>
