<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = ''
	} = $props<{
		children?: Snippet;
		class?: string;
	}>();
</script>

<tbody class="{className}">
	{@render children?.()}
</tbody>
