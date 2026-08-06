<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'p',
		className = '',
		children
	}: {
		variant?: 'h1' | 'h2' | 'h3' | 'p' | 'label' | 'label-sm';
		className?: string;
		children?: Snippet;
	} = $props();
</script>

{#if variant === 'h1'}
	<h1
		class="font-heading text-5xl leading-tight font-extrabold tracking-tight md:text-6xl {className}"
	>
		{@render children?.()}
	</h1>
{:else if variant === 'h2'}
	<h2
		class="font-heading text-4xl leading-snug font-extrabold tracking-tight md:text-5xl {className}"
	>
		{@render children?.()}
	</h2>
{:else if variant === 'h3'}
	<h3 class="font-heading text-2xl leading-snug font-bold tracking-tight md:text-3xl {className}">
		{@render children?.()}
	</h3>
{:else if variant === 'p'}
	<p class="font-sans text-base leading-relaxed font-normal md:text-lg {className}">
		{@render children?.()}
	</p>
{:else if variant === 'label'}
	<label class="font-mono text-sm font-bold tracking-wide uppercase {className}">
		{@render children?.()}
	</label>
{:else if variant === 'label-sm'}
	<span class="font-mono text-xs font-normal {className}">
		{@render children?.()}
	</span>
{/if}
