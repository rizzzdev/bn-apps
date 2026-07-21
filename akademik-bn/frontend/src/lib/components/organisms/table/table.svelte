<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: className = '' } = $props<{
		children?: Snippet;
		class?: string;
	}>();
</script>

<div class="w-full overflow-x-auto neo-border neo-shadow bg-surface {className}">
	<table class="w-full text-left border-collapse">
		{@render children?.()}
	</table>
</div>
