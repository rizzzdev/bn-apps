<script lang="ts">
	import Icon from './icon.svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';
	
	type BaseProps = {
		icon: string;
		label: string;
		variant?: 'primary' | 'secondary' | 'error' | 'warning' | 'success';
		class?: string;
		tooltipPosition?: 'center' | 'left' | 'right';
	};

	type ButtonProps = BaseProps & HTMLButtonAttributes & { href?: undefined };
	type AnchorProps = BaseProps & HTMLAnchorAttributes & { href: string };

	let {
		icon,
		label,
		variant = 'secondary',
		class: className = '',
		tooltipPosition = 'center',
		href,
		...rest
	} = $props<ButtonProps | AnchorProps>();
	
	let variantClasses = $derived.by(() => {
		switch (variant) {
			case 'primary': return 'bg-primary text-on-background border-on-background hover:bg-green-500';
			case 'error': return 'bg-surface text-error border-on-background hover:bg-error hover:text-surface';
			case 'warning': return 'bg-surface text-warning border-on-background hover:bg-warning hover:text-on-background';
			case 'success': return 'bg-surface text-success border-on-background hover:bg-success hover:text-on-background';
			default: return 'bg-surface text-on-background border-on-background hover:bg-slate-200'; // secondary
		}
	});

	let baseClasses = "relative group inline-flex items-center justify-center p-1.5 border-2 transition-colors cursor-pointer";

	let tooltipClasses = $derived.by(() => {
		switch (tooltipPosition) {
			case 'left': return 'right-0';
			case 'right': return 'left-0';
			default: return 'left-1/2 -translate-x-1/2';
		}
	});

	let arrowClasses = $derived.by(() => {
		switch (tooltipPosition) {
			case 'left': return 'right-2';
			case 'right': return 'left-2';
			default: return 'left-1/2 -translate-x-1/2';
		}
	});
</script>

{#if href}
	<a {href} class="{baseClasses} {variantClasses} {className}" {...rest as HTMLAnchorAttributes}>
		<Icon name={icon} class="text-sm" />
		<span class="absolute bottom-full mb-2 {tooltipClasses} whitespace-nowrap px-2 py-1 bg-on-background text-surface text-xs font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
			{label}
			<span class="absolute top-full {arrowClasses} border-4 border-transparent border-t-on-background"></span>
		</span>
	</a>
{:else}
	<button type="button" class="{baseClasses} {variantClasses} {className}" {...rest as HTMLButtonAttributes}>
		<Icon name={icon} class="text-sm" />
		<span class="absolute bottom-full mb-2 {tooltipClasses} whitespace-nowrap px-2 py-1 bg-on-background text-surface text-xs font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
			{label}
			<span class="absolute top-full {arrowClasses} border-4 border-transparent border-t-on-background"></span>
		</span>
	</button>
{/if}
