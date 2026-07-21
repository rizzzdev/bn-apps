<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'primary',
		class: className = ''
	} = $props<{
		children?: Snippet;
		variant?: 'primary' | 'secondary' | 'error' | 'success' | 'outline';
		class?: string;
	}>();

	let variantClass = $derived(
		variant === 'primary'
			? 'bg-primary'
			: variant === 'secondary'
				? 'bg-secondary'
				: variant === 'error'
					? 'bg-error text-white'
					: variant === 'success'
						? 'bg-success'
						: 'bg-surface'
	);
</script>

<span
	class="inline-block px-2 py-0.5 text-xs font-bold border-2 border-on-background shadow-neo-xs {variantClass} {className}"
>
	{@render children?.()}
</span>
