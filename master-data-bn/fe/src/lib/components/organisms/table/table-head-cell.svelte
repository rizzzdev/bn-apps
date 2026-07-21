<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		align = 'left',
		width = ''
	} = $props<{
		children?: Snippet;
		class?: string;
		align?: 'left' | 'center' | 'right';
		width?: string;
	}>();
</script>

<th 
	class="p-md font-label-sm text-label-sm uppercase text-on-surface border-r-3 border-on-background last:border-r-0 {align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} {width} {className}"
>
	{@render children?.()}
</th>
