<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		hoverable = false
	} = $props<{
		children?: Snippet;
		class?: string;
		hoverable?: boolean;
	}>();

	let hoverClass = $derived(
		hoverable
			? 'hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] transition-all duration-200'
			: ''
	);
</script>

<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6 {hoverClass} {className}">
	{@render children?.()}
</div>
