<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		align = 'left',
		width = '',
		class: className = ''
	} = $props<{
		children?: Snippet;
		align?: 'left' | 'center' | 'right';
		width?: string;
		class?: string;
	}>();
</script>

<th
	class="p-4 font-label-caps text-label-caps text-on-tertiary-fixed uppercase border-r-2 text-{align} {width} {className}"
>
	{@render children?.()}
</th>
