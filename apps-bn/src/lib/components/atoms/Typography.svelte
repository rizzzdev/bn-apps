<script lang="ts">
	import type { Snippet } from 'svelte';

	let { variant = 'p', className = '', children }: { variant?: 'h1' | 'h2' | 'h3' | 'p' | 'label' | 'label-sm', className?: string, children?: Snippet } = $props();
</script>

{#if variant === 'h1'}
	<h1 class="font-heading text-5xl md:text-6xl font-extrabold tracking-tight leading-tight {className}">
		{@render children?.()}
	</h1>
{:else if variant === 'h2'}
	<h2 class="font-heading text-4xl md:text-5xl font-extrabold tracking-tight leading-snug {className}">
		{@render children?.()}
	</h2>
{:else if variant === 'h3'}
	<h3 class="font-heading text-2xl md:text-3xl font-bold tracking-tight leading-snug {className}">
		{@render children?.()}
	</h3>
{:else if variant === 'p'}
	<p class="font-sans text-base md:text-lg font-normal leading-relaxed {className}">
		{@render children?.()}
	</p>
{:else if variant === 'label'}
	<label class="font-mono text-sm font-bold uppercase tracking-wide {className}">
		{@render children?.()}
	</label>
{:else if variant === 'label-sm'}
	<span class="font-mono text-xs font-normal {className}">
		{@render children?.()}
	</span>
{/if}
