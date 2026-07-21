<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		hover = true,
		header = false,
		striped = false
	} = $props<{
		children?: Snippet;
		class?: string;
		hover?: boolean;
		header?: boolean;
		striped?: boolean;
	}>();
</script>

<tr 
	class="border-b-3 border-on-background {header ? 'bg-surface-variant' : ''} {striped ? 'bg-surface-container-highest/20' : ''} {hover && !header ? 'hover:bg-surface-container-low transition-colors' : ''} {className}"
>
	{@render children?.()}
</tr>
