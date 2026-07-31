<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: className = '' } = $props<{
		children?: Snippet;
		class?: string;
	}>();
</script>

<thead class="bg-tertiary-fixed border-b-2 {className}">
	{@render children?.()}
</thead>
