<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import 'leaflet/dist/leaflet.css';
	import type * as LType from 'leaflet';
	import { Select } from '$lib/components/molecules';
	import { MAP_MODES, MAP_MODE_OPTIONS } from '$lib/constants/maps';
	import type { MapMode } from '$lib/constants/maps';

	let { location } = $props<{ location: { latitude: number; longitude: number } }>();

	let mapElement: HTMLElement;
	let map: LType.Map | undefined;
	let marker: LType.Marker | undefined;
	let currentLayer: any;
	let L: any;

	let currentMode = $state<MapMode>('standard');

	onMount(async () => {
		if (browser) {
			L = (await import('leaflet')).default || await import('leaflet');
			// Fix leaflet icon issue in svelteKit/vite
			delete (L.Icon.Default.prototype as any)._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
				iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
			});

			map = L.map(mapElement, { attributionControl: false }).setView([location.latitude, location.longitude], 15);
			currentLayer = L.tileLayer(MAP_MODES[currentMode].url, { maxZoom: MAP_MODES[currentMode].maxZoom }).addTo(map);

			marker = L.marker([location.latitude, location.longitude]).addTo(map);
		}
	});

	$effect(() => {
		if (map && location && marker) {
			map.setView([location.latitude, location.longitude], 15);
			marker.setLatLng([location.latitude, location.longitude]);
		}
	});

	$effect(() => {
		const mode = currentMode;
		if (map && currentLayer && L) {
			map.removeLayer(currentLayer);
			currentLayer = L.tileLayer(MAP_MODES[mode].url, { maxZoom: MAP_MODES[mode].maxZoom }).addTo(map);
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

	<div class="border-4 border-on-background relative z-0">
	<div bind:this={mapElement} class="w-full h-[300px]"></div>
	<div class="absolute top-2 right-2 z-[1000] w-48">
		<Select 
			bind:value={currentMode} 
			options={MAP_MODE_OPTIONS}
			searchable={false}
			variant="small"
		/>
	</div>
</div>
<p class="text-xs font-mono text-secondary mt-1">
	Lat {location.latitude.toFixed(6)}, Lng {location.longitude.toFixed(6)}
</p>
<p class="text-[10px] text-slate-400 mt-1">
	{@html MAP_MODES[currentMode].attribution}
</p>
