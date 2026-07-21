<script lang="ts">
	import { AuthLayout } from '$lib/components/templates';
	import type { Snippet } from 'svelte';

	let { children } = $props<{ children: Snippet }>();
</script>

<AuthLayout>
	{@render children()}
</AuthLayout>
