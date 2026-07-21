<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import SideNavBar from '$lib/components/organisms/side-nav-bar.svelte';
	import TopNavBar from '$lib/components/organisms/top-nav-bar.svelte';
	
	let { children } = $props<{ children: Snippet }>();
	
	let currentRole = $derived(() => {
		const path = $page.url.pathname;
		if (path.startsWith('/admin')) return 'super_admin';
		if (path.startsWith('/teacher')) return 'teacher';
		if (path.startsWith('/student')) return 'student';
		if (path.startsWith('/mentor')) return 'industry_mentor';
		return 'super_admin';
	});

	let isSidebarOpen = $state(false);
</script>

<div class="bg-surface text-on-background font-body min-h-screen flex overflow-x-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
	<SideNavBar bind:isOpen={isSidebarOpen} />
	
	<!-- Overlay for mobile when sidebar is open -->
	{#if isSidebarOpen}
		<div 
			class="fixed inset-0 bg-black/50 z-30 md:hidden" 
			onclick={() => isSidebarOpen = false}
			onkeydown={(e) => e.key === 'Escape' && (isSidebarOpen = false)}
			role="button"
			tabindex="0"
			aria-label="Tutup menu"
		></div>
	{/if}
	
	<!-- Main Content Area -->
	<div class="flex-1 md:ml-64 flex flex-col min-h-screen w-full relative">
		<TopNavBar bind:isSidebarOpen />
		
		<!-- Main Canvas -->
		<main class="flex-1 p-4 md:p-8 space-y-6">
			{@render children()}
		</main>
	</div>
</div>
