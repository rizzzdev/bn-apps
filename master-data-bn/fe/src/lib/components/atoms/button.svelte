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
	const baseClasses = "transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-x-0 disabled:hover:translate-y-0";
	let variantClasses = $derived.by(() => {
		switch (variant) {
			case 'primary':
				return "bg-primary text-on-primary font-body-bold text-body-bold py-sm px-md flex items-center justify-between border-3 rounded-lg border-on-background shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-xs group";
			case 'secondary':
				return "bg-secondary text-on-secondary font-label-sm text-label-sm py-xs px-sm gap-xs flex items-center uppercase border-3 rounded-lg border-on-background shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-xs";
			case 'action':
				return "bg-secondary text-on-secondary font-body-bold text-body-bold py-sm px-md flex items-center justify-between border-3 rounded-lg border-on-background shadow-neo hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-xs group w-full";
			case 'error':
				return "bg-error text-on-error font-label-sm text-label-sm py-xs px-sm gap-xs flex w-full items-center justify-center uppercase border-3 rounded-lg border-on-background shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs";
			case 'warning':
				return "bg-[#FCD34D] text-on-surface font-label-sm text-label-sm py-xs px-sm gap-xs flex w-full items-center justify-center uppercase border-3 rounded-lg border-on-background shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs";
			case 'info':
				return "bg-secondary text-on-secondary font-label-sm text-label-sm py-xs px-sm gap-xs flex w-full items-center justify-center uppercase border-3 rounded-lg border-on-background shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs";
			case 'icon':
				return "p-xs rounded-full border-3 rounded-lg border-transparent hover:border-on-background group hover:translate-x-1 hover:translate-y-1 hover:shadow-neo-xs";
			default:
				return "";
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
