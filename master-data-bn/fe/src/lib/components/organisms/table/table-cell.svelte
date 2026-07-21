<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		align = 'left',
		colspan
	} = $props<{
		children?: Snippet;
		class?: string;
		align?: 'left' | 'center' | 'right';
		colspan?: number;
	}>();
</script>

<td 
	{colspan}
	class="p-md font-body-base text-body-base border-r-3 border-on-background last:border-r-0 {align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} {className}"
>
	{@render children?.()}
</td>
