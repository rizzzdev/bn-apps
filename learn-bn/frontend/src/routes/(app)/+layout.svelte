<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import SideNavBar from '$lib/components/layout/SideNavBar.svelte';
	import TopAppBar from '$lib/components/layout/TopAppBar.svelte';

	let { children } = $props();

	onMount(() => {
		if (!authState.user) {
			goto('/login');
		}
	});
</script>

{#if authState.user}
	<!-- Main Content Area -->
	<SideNavBar />
	<div class="flex-1 md:ml-64 flex flex-col min-h-screen">
		<TopAppBar title="EduBrutal LMS" />
		<main class="flex-1 p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full relative">
			{@render children()}
		</main>
	</div>
{/if}
