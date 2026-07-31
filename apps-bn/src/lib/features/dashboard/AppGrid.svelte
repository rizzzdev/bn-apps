<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/molecules/Card.svelte';
	import { appsStore, mapApiAppToAppItem, type ApiApplication } from '$lib/stores/apps';

	let { initialApplications = [] }: { initialApplications?: ApiApplication[] } = $props();

	let apps = $derived(
		initialApplications && initialApplications.length > 0 && $appsStore.length === 0
			? initialApplications.map(mapApiAppToAppItem)
			: $appsStore
	);

	onMount(() => {
		if (initialApplications && initialApplications.length > 0) {
			appsStore.setAppsFromApi(initialApplications);
		}
	});
</script>

{#if apps.length > 0}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 w-full box-border">
		{#each apps as app (app.id)}
			<Card variant="app" href={app.href} icon={app.icon}>
				<h2 class="font-headline-lg text-base md:text-lg text-white mb-1.5 leading-tight break-words group-hover:text-secondary-fixed transition-colors">
					{app.title}
				</h2>
				<p class="font-body-md text-xs text-gray-200 opacity-90 leading-relaxed">
					{app.description}
				</p>
			</Card>
		{/each}
	</div>
{:else}
	<div class="w-full bg-surface rounded-2xl neo-border neo-shadow p-8 text-center flex flex-col items-center justify-center gap-3">
		<span class="material-symbols-outlined text-5xl text-on-surface-variant">apps_outage</span>
		<h3 class="font-headline-lg text-xl text-on-surface font-bold">Tidak Ada Aplikasi</h3>
		<p class="font-body-md text-sm text-on-surface-variant max-w-md">
			Belum ada data aplikasi yang tersedia saat ini. Silakan tambahkan aplikasi melalui halaman Manajemen Aplikasi.
		</p>
	</div>
{/if}


