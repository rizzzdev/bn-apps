<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: className = '' } = $props<{
		children?: Snippet;
		class?: string;
	}>();
</script>

<tbody class="font-body-md text-body-md text-on-surface {className}">
	{@render children?.()}
</tbody>
