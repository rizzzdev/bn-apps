<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'default',
		class: className = ''
	} = $props<{
		children?: Snippet;
		variant?: 'default' | 'success' | 'error' | 'warning';
		class?: string;
	}>();

	let variantClasses = $derived.by(() => {
		switch (variant) {
			case 'success':
				return 'bg-secondary-fixed text-on-secondary-fixed border-2 border-on-background shadow-[2px_2px_0px_0px_#1C1B1B]';
			case 'error':
				return 'bg-error text-on-error border-2 border-on-background shadow-[2px_2px_0px_0px_#1C1B1B]';
			case 'warning':
				return 'bg-outline-variant text-on-background border-2 border-on-background shadow-[2px_2px_0px_0px_#1C1B1B]';
			default:
				return 'bg-secondary-container text-on-secondary-container border-2 border-on-background shadow-[2px_2px_0px_0px_#1C1B1B]';
		}
	});
</script>

<span
	class="inline-block px-2 py-1 font-data-mono text-data-mono font-bold {variantClasses} {className}"
>
	{@render children?.()}
</span>
