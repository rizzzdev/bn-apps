<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	// The props type discriminates between button and anchor based on href
	type BaseProps = {
		variant?: 'primary' | 'secondary' | 'error' | 'warning' | 'success';
		size?: 'sm' | 'md' | 'lg' | 'icon';
		isLoading?: boolean;
		class?: string;
		children?: Snippet;
	};

	type ButtonProps = BaseProps & HTMLButtonAttributes & { href?: undefined };
	type AnchorProps = BaseProps & HTMLAnchorAttributes & { href: string };

	let {
		variant = 'primary',
		size = 'md',
		isLoading = false,
		disabled = false,
		class: className = '',
		children,
		href,
		...rest
	} = $props<ButtonProps | AnchorProps>();

	let variantClasses = $derived.by(() => {
		switch (variant) {
			case 'primary':
				return 'bg-primary text-on-background border-on-background';
			case 'secondary':
				return 'bg-surface text-on-background border-on-background';
			case 'error':
				return 'bg-error text-surface border-on-background';
			case 'warning':
				return 'bg-warning text-on-background border-on-background';
			case 'success':
				return 'bg-success text-on-background border-on-background';
			default:
				return 'bg-primary text-on-background border-on-background';
		}
	});
	
	let sizeClasses = $derived.by(() => {
		switch (size) {
			case 'sm': return 'px-4 py-2 text-sm';
			case 'lg': return 'px-8 py-4 text-lg';
			case 'icon': return 'p-1.5 aspect-square';
			default: return 'px-6 py-3'; // md
		}
	});
	
	let baseClasses =
		'inline-flex items-center justify-center gap-2 border-4 font-headline font-bold transition-all duration-100 ease-in-out';
	
	let isDisabled = $derived(isLoading || disabled || ('disabled' in rest ? (rest as any).disabled : false));

	let stateClasses = $derived(
		isDisabled 
			? 'opacity-50 cursor-not-allowed shadow-none translate-x-[4px] translate-y-[4px] pointer-events-none' 
			: 'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none shadow-neo'
	);
</script>

{#if href}
	<a {href} class="{baseClasses} {variantClasses} {sizeClasses} {stateClasses} {className}" {...rest as HTMLAnchorAttributes}>
		{#if isLoading}
			<span class="material-symbols-outlined animate-spin" style="font-variation-settings: 'FILL' 0;">progress_activity</span>
		{/if}
		{#if children}{@render children()}{/if}
	</a>
{:else}
	<button
		class="{baseClasses} {variantClasses} {sizeClasses} {stateClasses} {className}"
		disabled={isDisabled}
		{...rest as HTMLButtonAttributes}
	>
		{#if isLoading}
			<span class="material-symbols-outlined animate-spin" style="font-variation-settings: 'FILL' 0;">progress_activity</span>
		{/if}
		{#if children}{@render children()}{/if}
	</button>
{/if}
