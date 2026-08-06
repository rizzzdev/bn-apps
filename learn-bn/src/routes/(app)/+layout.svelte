<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import SideNavBar from '$lib/components/layout/SideNavBar.svelte';
	import TopAppBar from '$lib/components/layout/TopAppBar.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	$effect(() => {
		if (data.user) {
			authState.initUser(data.user);
		}
	});

	let isSidebarOpen = $state(false);

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	function closeSidebar() {
		isSidebarOpen = false;
	}
</script>

{#if authState.user || data.user}
	<SideNavBar isMobileOpen={isSidebarOpen} onClose={closeSidebar} />
	<div class="flex-1 md:ml-64 flex flex-col min-h-dvh">
		<TopAppBar onToggleSidebar={toggleSidebar} />
		<main class="flex-1 p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full relative">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="min-h-dvh flex items-center justify-center font-bold text-xl">Loading...</div>
{/if}
