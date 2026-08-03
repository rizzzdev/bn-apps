<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: className = '' } = $props<{ children?: Snippet; class?: string }>();
</script>

<div
	class="w-full overflow-x-auto rounded-lg border-2 border-on-background bg-surface shadow-neo-xs"
>
	<table class="w-full border-collapse text-left text-xs font-body-base {className}">
		{@render children?.()}
	</table>
</div>
