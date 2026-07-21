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

<div class="bg-surface-container-lowest overflow-hidden border-3 rounded-xl border-on-background shadow-neo {className}">
	<div class="w-full overflow-x-auto">
		<table class="w-full text-left border-collapse">
			{@render children?.()}
		</table>
	</div>
</div>
