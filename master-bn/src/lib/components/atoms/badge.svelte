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
	class="font-label-sm text-label-sm text-on-background border-on-background border-3 rounded-md px-1 py-0.5 uppercase font-bold tracking-wider shadow-neo-2xs inline-flex items-center justify-center {className}"
	style="background-color: {color};"
>
	{@render children?.()}
</span>
