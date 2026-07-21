<script lang="ts">
	import { Icon, Button } from '$lib/components/atoms';

	import type { Snippet } from 'svelte';

	let {
		children,
		class: className = '',
		...rest
	} = $props<{
		children?: Snippet;
		class?: string;
		[key: string]: unknown;
	}>();
</script>

<Button variant="action" class="mb-sm {className}" {...rest}>
	<span>{@render children?.()}</span>
	<Icon name="arrow_forward" class="transition-transform group-hover:translate-x-1" />
</Button>
