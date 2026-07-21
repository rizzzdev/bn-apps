<script lang="ts">
	import { TopNavBar, SideNavBar } from '$lib/components/organisms';

	import type { Snippet } from 'svelte';

	let { children } = $props<{ children?: Snippet }>();
	
	let isMobileMenuOpen = $state(false);
</script>

<div class="min-h-screen bg-background bg-[linear-gradient(to_right,#0000001a_1px,transparent_1px),linear-gradient(to_bottom,#0000001a_1px,transparent_1px)] bg-[size:32px_32px]">
	<SideNavBar bind:isOpen={isMobileMenuOpen} />
	<TopNavBar bind:isMenuOpen={isMobileMenuOpen} />
	
	<!-- Main Content Area -->
	<main class="p-sm md:p-md lg:p-lg xl:p-xl mx-auto max-w-[1200px] xl:max-w-[1400px] md:ml-64">
		{@render children?.()}
	</main>
</div>
