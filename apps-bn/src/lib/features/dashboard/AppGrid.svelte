<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/molecules/Card.svelte';
	import { appsStore, mapApiAppToAppItem, type ApiApplication } from '$lib/stores/apps';
	import { apiClient } from '$lib/utils/api';

	let { initialApplications = [] }: { initialApplications?: ApiApplication[] } = $props();

	// State saat fallback fetch ke database (data SSR kosong)
	let isLoading = $state(false);

	// Utamakan data dari database (SSR); store dipakai hanya sebagai cadangan,
	// misalnya saat data SSR kosong tetapi cache in-memory masih terisi.
	let apps = $derived(
		initialApplications && initialApplications.length > 0
			? initialApplications.map(mapApiAppToAppItem)
			: $appsStore
	);

	onMount(async () => {
		if (initialApplications && initialApplications.length > 0) {
			appsStore.setAppsFromApi(initialApplications);
			return;
		}

		// Data SSR tidak tersedia — muat langsung dari database agar tidak kosong.
		// Loading hanya ditampilkan jika belum ada data sama sekali (hindari flash di atas konten lama).
		isLoading = $appsStore.length === 0;
		try {
			const res = await apiClient('/master/applications?page=1&limit=100');
			if (res.ok) {
				const responseData = await res.json();
				if (responseData.data && Array.isArray(responseData.data)) {
					appsStore.setAppsFromApi(responseData.data);
				}
			}
		} catch (err) {
			console.error('Failed to load applications from database:', err);
		} finally {
			isLoading = false;
		}
	});
</script>

{#if isLoading}
	<div
		class="neo-border neo-shadow flex w-full flex-col items-center justify-center gap-3 rounded-2xl bg-surface p-8 text-center"
	>
		<span class="material-symbols-outlined animate-spin text-5xl text-primary"
			>progress_activity</span
		>
		<h3 class="font-headline-lg text-xl font-bold text-on-surface">Memuat Aplikasi...</h3>
	</div>
{:else if apps.length > 0}
	<div
		class="box-border grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4"
	>
		{#each apps as app (app.id)}
			<Card variant="app" href={app.href} icon={app.icon}>
				<h2
					class="mb-1.5 font-headline-lg text-base leading-tight break-words text-white transition-colors group-hover:text-secondary-fixed md:text-lg"
				>
					{app.title}
				</h2>
				<p class="font-body-md text-xs leading-relaxed text-gray-200 opacity-90">
					{app.description}
				</p>
			</Card>
		{/each}
	</div>
{:else}
	<div
		class="neo-border neo-shadow flex w-full flex-col items-center justify-center gap-3 rounded-2xl bg-surface p-8 text-center"
	>
		<span class="material-symbols-outlined text-5xl text-on-surface-variant">apps_outage</span>
		<h3 class="font-headline-lg text-xl font-bold text-on-surface">Tidak Ada Aplikasi</h3>
		<p class="max-w-md font-body-md text-sm text-on-surface-variant">
			Belum ada data aplikasi yang tersedia saat ini. Silakan tambahkan aplikasi melalui halaman
			Manajemen Aplikasi.
		</p>
	</div>
{/if}
