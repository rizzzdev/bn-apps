<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		...rest
	} = $props<{ children?: Snippet; class?: string; [key: string]: unknown }>();
</script>

<th class="p-2.5 px-3 border-r-2 border-on-background last:border-r-0 {className}" {...rest}>
	{@render children?.()}
</th>
