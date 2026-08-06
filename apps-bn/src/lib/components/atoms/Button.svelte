<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		type = 'button',
		className = '',
		disabled = false,
		children,
		onclick
	}: {
		variant?: 'primary' | 'secondary' | 'nav';
		type?: 'button' | 'submit' | 'reset';
		className?: string;
		disabled?: boolean;
		children?: Snippet;
		onclick?: (e: MouseEvent) => void;
	} = $props();
</script>

{#if variant === 'primary'}
	<button
		{type}
		{disabled}
		class="neo-border neo-shadow neo-shadow-hover group relative w-full overflow-hidden rounded-lg bg-primary-container py-3 font-headline-md text-base text-on-primary uppercase transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 {className}"
		{onclick}
	>
		<span class="relative z-10 font-bold tracking-wider">{@render children?.()}</span>
		<div
			class="absolute inset-0 z-0 h-full w-0 bg-on-primary-fixed-variant transition-all duration-500 ease-out group-hover:w-full"
		></div>
	</button>
{:else if variant === 'secondary'}
	<button
		{type}
		{disabled}
		class="neobrutal-shadow neobrutal-shadow-hover group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border-3 border-black bg-secondary-fixed py-3 font-label-bold text-sm tracking-wider text-black uppercase transition-all disabled:cursor-not-allowed disabled:opacity-50 md:border-4 {className}"
		{onclick}
	>
		<span
			class="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover:text-white"
		>
			{@render children?.()}
		</span>
		<div
			class="absolute inset-0 z-0 h-full w-0 bg-primary-container transition-all duration-500 ease-out group-hover:w-full"
		></div>
	</button>
{:else if variant === 'nav'}
	<button
		{type}
		{disabled}
		class="md:text-label-bold group relative overflow-hidden rounded-lg border-3 border-black bg-error px-3.5 py-1.5 font-label-bold text-xs tracking-wider text-white uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 md:rounded-xl md:border-4 md:px-6 md:py-2 md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] {className}"
		{onclick}
	>
		<span class="relative z-10">{@render children?.()}</span>
		<div
			class="absolute inset-0 z-0 h-full w-0 bg-[#93000a] transition-all duration-500 ease-out group-hover:w-full"
		></div>
	</button>
{/if}
