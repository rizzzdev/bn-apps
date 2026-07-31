<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		align = 'left',
		colspan = 1,
		class: className = ''
	} = $props<{
		children?: Snippet;
		align?: 'left' | 'center' | 'right';
		colspan?: number;
		class?: string;
	}>();
</script>

<td class="p-2 border-r-2 text-{align} {className}" {colspan}>
	{@render children?.()}
</td>
