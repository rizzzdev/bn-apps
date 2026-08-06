<script lang="ts">
	import { page } from '$app/stores';
	import { resolveRoute } from '$app/paths';

	let {
		text = 'Apps-BN',
		href = '/',
		size = 'md',
		variant = 'default',
		className = '',
		disabled = false
	}: {
		text?: string;
		href?: string;
		size?: 'sm' | 'md' | 'lg';
		variant?: 'default' | 'white';
		className?: string;
		disabled?: boolean;
	} = $props();

	let isLoggedIn = $derived(!!$page.data?.user);
	let isLink = $derived(!disabled && isLoggedIn && href && href !== '#');

	let textSize = $derived(
		size === 'lg'
			? 'text-3xl md:text-4xl'
			: size === 'sm'
				? 'text-xl md:text-2xl'
				: 'text-2xl md:text-3xl'
	);

	// Swapped colors for white/footer variant: yellow text with white underline accent
	let textColor = $derived(variant === 'white' ? 'text-secondary-fixed' : 'text-on-surface');
	let lineColor = $derived(variant === 'white' ? 'bg-on-surface' : 'bg-secondary-fixed');
</script>

{#if isLink}
	<a
		href={resolveRoute(href as Parameters<typeof resolveRoute>[0])}
		class="relative inline-block {textSize} font-headline-lg font-extrabold {textColor} z-10 px-1 tracking-tighter uppercase transition-opacity hover:opacity-95 {className}"
	>
		<span class="absolute right-0 bottom-1 left-0 h-3.5 {lineColor} -z-10 -rotate-1 transform"
		></span>
		{text}
	</a>
{:else}
	<div
		class="relative inline-block {textSize} font-headline-lg font-extrabold {textColor} z-10 px-1 tracking-tighter uppercase select-none {className}"
	>
		<span class="absolute right-0 bottom-1 left-0 h-3.5 {lineColor} -z-10 -rotate-1 transform"
		></span>
		{text}
	</div>
{/if}
