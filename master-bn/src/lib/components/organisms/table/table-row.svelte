<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		...rest
	} = $props<{ children?: Snippet; class?: string; [key: string]: unknown }>();
</script>

<tr class="transition-colors hover:bg-surface-container-low/60 {className}" {...rest}>
	{@render children?.()}
</tr>
