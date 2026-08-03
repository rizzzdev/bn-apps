<script lang="ts">
	import { DashboardLayout, Forbidden } from '$lib/components/templates';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { children } = $props<{ children: Snippet }>();

	let accessDenied = $derived($page.data.accessDenied ?? false);
</script>

{#if accessDenied}
	<Forbidden />
{:else}
	<DashboardLayout>
		{@render children()}
	</DashboardLayout>
{/if}
