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

<thead class="{className}">
	{@render children?.()}
</thead>
