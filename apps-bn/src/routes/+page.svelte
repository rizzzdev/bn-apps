<script lang="ts">
	import Navbar from '$lib/components/organisms/Navbar.svelte';
	import Footer from '$lib/components/organisms/Footer.svelte';
	import DashboardHero from '$lib/features/dashboard/DashboardHero.svelte';
	import AppGrid from '$lib/features/dashboard/AppGrid.svelte';
	import DashboardDecorativeOrnaments from '$lib/features/dashboard/DashboardDecorativeOrnaments.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="bg-background bg-grid-boxes text-on-background min-h-screen flex flex-col font-body-md text-body-md relative overflow-x-hidden w-full box-border pt-14 md:pt-16">
	<DashboardDecorativeOrnaments />
	<Navbar currentPath="/" />
	<main class="flex-grow w-full px-4 sm:px-6 lg:px-8 py-3 md:py-5 relative z-10 box-border">
		<DashboardHero user={data?.user} />
		<AppGrid initialApplications={data?.applications} />
	</main>
	<Footer />
</div>
