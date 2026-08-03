<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: className = '' } = $props<{ children?: Snippet; class?: string }>();
</script>

<thead
	class="bg-surface-variant text-on-surface border-b-2 border-on-background font-bold uppercase tracking-wider text-xs {className}"
>
	{@render children?.()}
</thead>
