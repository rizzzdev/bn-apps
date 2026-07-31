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
		class="w-full bg-primary-container text-on-primary font-headline-md text-base py-3 rounded-lg uppercase neo-border neo-shadow neo-shadow-hover transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed {className}"
		{onclick}
	>
		<span class="relative z-10 font-bold tracking-wider">{@render children?.()}</span>
		<div class="absolute inset-0 h-full w-0 bg-on-primary-fixed-variant transition-all duration-500 ease-out group-hover:w-full z-0"></div>
	</button>
{:else if variant === 'secondary'}
	<button
		{type}
		{disabled}
		class="w-full bg-secondary-fixed text-black border-3 md:border-4 border-black py-3 font-label-bold text-sm neobrutal-shadow neobrutal-shadow-hover transition-all flex items-center justify-center gap-2 rounded-lg uppercase tracking-wider relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed {className}"
		{onclick}
	>
		<span class="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors duration-300">
			{@render children?.()}
		</span>
		<div class="absolute inset-0 h-full w-0 bg-primary-container transition-all duration-500 ease-out group-hover:w-full z-0"></div>
	</button>
{:else if variant === 'nav'}
	<button
		{type}
		{disabled}
		class="bg-error text-white border-3 md:border-4 border-black font-label-bold text-xs md:text-label-bold px-3.5 py-1.5 md:px-6 md:py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all rounded-lg md:rounded-xl uppercase tracking-wider relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed {className}"
		{onclick}
	>
		<span class="relative z-10">{@render children?.()}</span>
		<div class="absolute inset-0 h-full w-0 bg-[#93000a] transition-all duration-500 ease-out group-hover:w-full z-0"></div>
	</button>
{/if}
