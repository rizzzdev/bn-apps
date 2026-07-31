<script lang="ts">
	import Navbar from '$lib/components/organisms/Navbar.svelte';
	import Footer from '$lib/components/organisms/Footer.svelte';
	import ApplicationTable from '$lib/features/application/ApplicationTable.svelte';
	import Banner from '$lib/components/molecules/Banner.svelte';
	import Forbidden from '$lib/components/molecules/Forbidden.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isSuperAdmin = $derived(
		data.isSuperAdmin !== undefined
			? data.isSuperAdmin
			: Boolean(
					(data as Record<string, unknown>).user &&
					typeof (data as Record<string, unknown>).user === 'object' &&
					(() => {
						const user = (data as Record<string, unknown>).user as {
							roles?: string[] | string;
						};
						return Array.isArray(user.roles)
							? user.roles.includes('super_admin')
							: user.roles === 'super_admin';
					})()
		  )
	);
</script>

<div class="bg-background bg-grid-boxes text-on-background min-h-screen flex flex-col font-body-md text-body-md relative overflow-x-hidden w-full box-border pt-14 md:pt-16">
	<Navbar currentPath="/application" />

	{#if isSuperAdmin}
		<main class="flex-grow w-full px-4 sm:px-6 lg:px-8 py-3 md:py-5 relative z-10 box-border">
			<div class="w-full space-y-4 md:space-y-6">
				<!-- Header / Banner Section -->
				<Banner
					badgeText="MANAJEMEN DAFTAR APLIKASI"
					title="Pengaturan Aplikasi Dashboard"
					description="Kelola aplikasi yang akan ditampilkan di halaman utama portal sekolah terpadu."
					icon="apps"
					variant="tertiary"
				/>

				<!-- Application Table -->
				<ApplicationTable initialApplications={data.applications} />
			</div>
		</main>
	{:else}
		<Forbidden />
	{/if}

	<Footer />
</div>
