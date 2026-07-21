<script lang="ts">
	import '../app.css';
	import DashboardLayout from '$lib/components/templates/dashboard-layout.svelte';
	import { ToastContainer } from '$lib/components/organisms';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	
	let { children } = $props();

	let isAuthRoute = $derived(
		$page.url.pathname.startsWith('/login') || 
		$page.url.pathname.startsWith('/403')
	);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if isAuthRoute}
	{@render children()}
{:else}
	<DashboardLayout>
		{@render children()}
	</DashboardLayout>
{/if}

<ToastContainer />
