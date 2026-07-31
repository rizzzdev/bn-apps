<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import SideNavBar from '$lib/components/layout/SideNavBar.svelte';
	import TopAppBar from '$lib/components/layout/TopAppBar.svelte';

	let { children } = $props();

	let isSidebarOpen = $state(false);

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	function closeSidebar() {
		isSidebarOpen = false;
	}

	onMount(async () => {
		if (!authState.user) {
			await authState.checkSession();
		}
		if (!authState.user) {
			goto('/login');
		}
	});
</script>

{#if authState.user}
	<SideNavBar isMobileOpen={isSidebarOpen} onClose={closeSidebar} />
	<div class="flex-1 md:ml-64 flex flex-col min-h-screen">
		<TopAppBar onToggleSidebar={toggleSidebar} />
		<main class="flex-1 p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full relative">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="min-h-screen flex items-center justify-center font-bold text-xl">Loading...</div>
{/if}
