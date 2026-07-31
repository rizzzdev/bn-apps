<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'primary',
		class: className = '',
		...rest
	} = $props<{
		children?: Snippet;
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon' | 'primary-container';
		class?: string;
		[key: string]: unknown;
	}>();

	const baseClasses =
		'inline-flex items-center justify-center neo-border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60';

	let variantClasses = $derived.by(() => {
		switch (variant) {
			case 'primary':
				return 'bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest neo-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-2 active:translate-y-2 px-6 h-11';
			case 'primary-container':
				return 'bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase tracking-widest neo-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-2 active:translate-y-2 px-6 h-11';
			case 'secondary':
				return 'bg-secondary-container text-on-secondary-container font-label-caps text-label-caps uppercase tracking-widest neo-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-2 active:translate-y-2 px-6 h-11';
			case 'danger':
				return 'bg-error text-on-error font-label-caps text-label-caps uppercase tracking-widest neo-shadow-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-2 active:translate-y-2 px-6 h-11';
			case 'ghost':
				return 'bg-surface text-on-surface font-label-caps text-label-caps uppercase tracking-widest neo-shadow-sm hover:bg-surface-container-high hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-2 active:translate-y-2 px-6 h-11';
			case 'icon':
				return 'bg-surface text-on-surface neo-border neo-shadow-xs hover:bg-surface-container-high flex items-center justify-center w-11 h-11 hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-2 active:translate-y-2';
		}
	});
</script>

{#if rest.href}
	<a class="{baseClasses} {variantClasses} {className}" {...rest}>
		{@render children?.()}
	</a>
{:else}
	<button class="{baseClasses} {variantClasses} {className}" {...rest}>
		{@render children?.()}
	</button>
{/if}
