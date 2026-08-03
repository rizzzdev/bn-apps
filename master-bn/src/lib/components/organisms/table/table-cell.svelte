<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		...rest
	} = $props<{ children?: Snippet; class?: string; [key: string]: unknown }>();
</script>

<td
	class="p-2.5 px-3 border-r-2 border-on-background last:border-r-0 align-middle {className}"
	{...rest}
>
	{@render children?.()}
</td>
