<script lang="ts">
	import Navbar from '$lib/components/organisms/Navbar.svelte';
	import Footer from '$lib/components/organisms/Footer.svelte';
	import DashboardHero from '$lib/features/dashboard/DashboardHero.svelte';
	import AppGrid from '$lib/features/dashboard/AppGrid.svelte';
	import DashboardDecorativeOrnaments from '$lib/features/dashboard/DashboardDecorativeOrnaments.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div
	class="bg-grid-boxes text-body-md relative box-border flex min-h-dvh w-full flex-col overflow-x-hidden bg-background pt-14 font-body-md text-on-background md:pt-16"
>
	<DashboardDecorativeOrnaments />
	<Navbar currentPath="/" />
	<main class="relative z-10 box-border w-full flex-grow px-4 py-3 sm:px-6 md:py-5 lg:px-8">
		<DashboardHero user={data?.user} />
		<AppGrid initialApplications={data?.applications} />
	</main>
	<Footer />
</div>
