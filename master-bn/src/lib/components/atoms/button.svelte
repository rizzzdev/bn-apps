<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'primary',
		class: className = '',
		...rest
	} = $props<{
		children?: Snippet;
		variant?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'icon' | 'action';
		class?: string;
		href?: string;
		[key: string]: unknown;
	}>();
	const baseClasses =
		'transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 text-xs font-bold font-body-bold border-2 rounded-md border-on-background shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-2xs disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0 max-w-max';
	let variantClasses = $derived.by(() => {
		switch (variant) {
			case 'primary':
				return 'bg-primary text-on-primary py-1 px-2.5 group';
			case 'secondary':
				return 'bg-secondary text-on-secondary py-1 px-2.5 uppercase tracking-wide';
			case 'action':
				return 'bg-secondary text-on-secondary py-0.5 px-2 uppercase tracking-wider group';
			case 'error':
				return 'bg-error text-on-error py-1 px-2.5 uppercase tracking-wide';
			case 'warning':
				return 'bg-[#FCD34D] text-on-surface py-1 px-2.5 uppercase tracking-wide';
			case 'info':
				return 'bg-secondary text-on-secondary py-1 px-2.5 uppercase tracking-wide';
			case 'icon':
				return 'p-1 rounded-md border-2 border-transparent hover:border-on-background group hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs';
			default:
				return '';
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
