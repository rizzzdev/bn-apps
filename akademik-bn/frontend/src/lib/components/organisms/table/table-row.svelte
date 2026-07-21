<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		striped = false,
		class: className = ''
	} = $props<{
		children?: Snippet;
		striped?: boolean;
		class?: string;
	}>();
</script>

<tr
	class="neo-border-b hover:bg-surface-container-low transition-colors {striped
		? 'bg-surface-bright'
		: ''} {className}"
>
	{@render children?.()}
</tr>
