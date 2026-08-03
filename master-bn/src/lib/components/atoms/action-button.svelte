<script lang="ts">
	import Icon from './icon.svelte';
	import { resolve } from '$app/paths';

	let {
		icon,
		title,
		href = '',
		variant = 'default',
		onclick,
		class: className = ''
	} = $props<{
		icon: string;
		title: string;
		href?: string;
		variant?: 'default' | 'danger' | 'info';
		onclick?: () => void;
		class?: string;
	}>();

	const baseClasses =
		'group relative h-8 w-8 border-2 rounded-lg border-on-background flex items-center justify-center transition-colors cursor-pointer';
	const tooltipClasses =
		"pointer-events-none absolute -top-8 right-0 w-max px-2 py-0.5 bg-on-background text-on-primary text-[8px] font-label-sm font-bold uppercase rounded-md shadow-neo-2xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 after:content-[''] after:absolute after:top-full after:right-2.5 after:border-4 after:border-transparent after:border-t-on-background";

	const variantClasses = $derived.by(() => {
		switch (variant) {
			case 'danger':
				return 'bg-error-container text-error hover:bg-error hover:text-on-error';
			case 'info':
				return 'bg-primary-container text-primary hover:bg-primary hover:text-on-primary';
			default:
				return 'bg-surface-container-highest hover:bg-secondary hover:text-on-secondary';
		}
	});
</script>

{#if href}
	<a href={resolve(href)} class="{baseClasses} {variantClasses} {className}">
		<Icon name={icon} class="text-[4px]" fill={0} />
		<span class={tooltipClasses}>{title}</span>
	</a>
{:else}
	<button {onclick} class="{baseClasses} {variantClasses} {className}">
		<Icon name={icon} class="text-[4px]" fill={0} />
		<span class={tooltipClasses}>{title}</span>
	</button>
{/if}
