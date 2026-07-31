<script lang="ts">
	import type { Snippet } from 'svelte';
	import { DashboardLayout } from '$lib/components/templates';
	
	let { children } = $props<{ children: Snippet }>();
</script>

<DashboardLayout>
	{@render children()}
</DashboardLayout>
