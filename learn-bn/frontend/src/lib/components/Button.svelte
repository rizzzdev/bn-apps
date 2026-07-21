<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'primary',
		size = 'md',
		type = 'button',
		class: className = '',
		onclick,
		disabled = false
	} = $props<{
		children?: Snippet;
		variant?: 'primary' | 'secondary' | 'error' | 'outline' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		onclick?: (e: MouseEvent) => void;
		disabled?: boolean;
	}>();

	let baseClass =
		'inline-flex items-center justify-center font-label-bold text-label-bold tracking-widest transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed gap-2';

	let sizeClass = $derived(
		size === 'sm' ? 'px-4 py-2 text-xs uppercase' : size === 'lg' ? 'px-8 py-4 text-base uppercase' : 'px-6 py-3 uppercase'
	);

	let variantClass = $derived(
		variant === 'primary'
			? 'bg-primary-container text-on-surface neo-border neo-shadow neo-shadow-hover neo-shadow-active'
			: variant === 'secondary'
				? 'bg-on-surface text-white neo-border neo-shadow neo-shadow-hover neo-shadow-active'
				: variant === 'error'
					? 'bg-error text-white neo-border neo-shadow neo-shadow-hover neo-shadow-active'
					: variant === 'outline'
						? 'bg-surface-container-lowest text-on-surface neo-border neo-shadow neo-shadow-hover neo-shadow-active'
						: 'border-2 border-transparent hover:bg-surface-container text-on-surface' // ghost
	);
</script>

<button {type} class="{baseClass} {sizeClass} {variantClass} {className}" {onclick} {disabled}>
	{@render children?.()}
</button>
