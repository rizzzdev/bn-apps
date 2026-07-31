<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		for: forAttr,
		class: className = ''
	} = $props<{
		children?: Snippet;
		for?: string;
		class?: string;
	}>();
</script>

<label
	for={forAttr}
	class="font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant {className}"
>
	{@render children?.()}
</label>
