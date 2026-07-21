<script lang="ts">
	import { DashboardLayout } from '$lib/components/templates';
	import type { Snippet } from 'svelte';

	let { children } = $props<{ children: Snippet }>();
</script>

<DashboardLayout>
	{@render children()}
</DashboardLayout>
