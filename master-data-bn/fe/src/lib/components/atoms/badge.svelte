<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		color = '#A3E635',
		class: className = ''
	} = $props<{
		children?: Snippet;
		color?: string;
		class?: string;
	}>();
</script>

<span
	class="font-label-sm text-label-sm text-on-background border-on-background border-2 px-2 py-1 uppercase {className}"
	style="background-color: {color};"
>
	{@render children?.()}
</span>
