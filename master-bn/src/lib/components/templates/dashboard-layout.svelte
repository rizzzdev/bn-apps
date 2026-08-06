<script lang="ts">
	import { TopNavBar, SideNavBar } from '$lib/components/organisms';

	import type { Snippet } from 'svelte';

	let { children } = $props<{ children?: Snippet }>();

	let isMobileMenuOpen = $state(false);
</script>

<div
	class="min-h-dvh w-full max-w-full overflow-x-hidden bg-background bg-[linear-gradient(to_right,#0000001a_1px,transparent_1px),linear-gradient(to_bottom,#0000001a_1px,transparent_1px)] bg-[size:24px_24px]"
>
	<SideNavBar bind:isOpen={isMobileMenuOpen} />
	<TopNavBar bind:isMenuOpen={isMobileMenuOpen} />

	<!-- Main Content Area: Fluid block container, zero overflow-x -->
	<main class="p-3 sm:p-3.5 md:p-4 pt-16 md:pt-18 md:ml-48 transition-all duration-300">
		{@render children?.()}
	</main>
</div>
