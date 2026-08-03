<script lang="ts">
	import '../app.css';
	import { DashboardLayout, Forbidden } from '$lib/components/templates';
	import { ToastContainer } from '$lib/components/organisms';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();

	let accessDenied = $derived($page.data.accessDenied ?? false);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if accessDenied}
	<Forbidden />
{:else}
	<DashboardLayout>
		{@render children()}
	</DashboardLayout>
{/if}

<ToastContainer />
