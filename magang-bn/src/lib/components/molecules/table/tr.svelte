<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type TrVariant = 'default' | 'header' | 'selected' | 'hover';

	interface Props extends HTMLAttributes<HTMLTableRowElement> {
		variant?: TrVariant;
		children?: Snippet;
	}

	let {
		variant = 'hover',
		children,
		...rest
	}: Props = $props();

	let variantClasses = $derived.by(() => {
		switch (variant) {
			case 'header':
				return 'border-b-2 border-on-background bg-slate-100 font-headline font-black uppercase text-xs tracking-wider';
			case 'selected':
				return 'border-b-2 border-on-background bg-blue-100 hover:bg-blue-150 transition-colors last:border-b-0';
			case 'hover':
				return 'border-b-2 border-on-background hover:bg-slate-50 transition-colors last:border-b-0';
			default:
				return 'border-b-2 border-on-background last:border-b-0';
		}
	});
</script>

<tr class={variantClasses} {...rest}>
	{#if children}{@render children()}{/if}
</tr>
