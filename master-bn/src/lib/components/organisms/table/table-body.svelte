<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: className = '' } = $props<{ children?: Snippet; class?: string }>();
</script>

<tbody class="divide-y-2 divide-on-background {className}">
	{@render children?.()}
</tbody>
