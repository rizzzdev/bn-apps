<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		for: htmlFor = '',
		class: className = '',
		children,
		...rest
	} = $props<{
		for?: string;
		class?: string;
		children?: Snippet;
		[key: string]: unknown;
	}>();
</script>

<label
	for={htmlFor}
	class="font-label-sm text-body-base text-on-surface mb-xs block {className}"
	{...rest}
>
	{@render children?.()}
</label>
