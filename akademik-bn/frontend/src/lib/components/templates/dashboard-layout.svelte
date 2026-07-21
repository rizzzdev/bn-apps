<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SideNavBar, TopNavBar } from '$lib/components/organisms';
	import { page } from '$app/stores';

	let { children } = $props<{
		children?: Snippet;
	}>();

	let isMobileMenuOpen = $state(false);
</script>

<div class="min-h-screen bg-background flex flex-col" style="--topnav-h: 84px;">
	<TopNavBar bind:isMobileMenuOpen />
	<div class="flex flex-1 min-h-0">
		<SideNavBar currentPath={$page.url.pathname} bind:isMobileMenuOpen />
		<main class="flex-1 md:ml-64 p-gutter md:p-margin w-full min-h-0">
			{@render children()}
		</main>
	</div>
</div>
