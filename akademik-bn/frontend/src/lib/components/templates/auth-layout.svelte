<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children } = $props<{
		children?: Snippet;
	}>();
</script>

<div class="min-h-screen bg-background flex">
	<div class="flex-1 flex flex-col">
		{@render children()}
	</div>
</div>
