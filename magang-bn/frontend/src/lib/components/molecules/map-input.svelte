<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import 'leaflet/dist/leaflet.css';
	import type * as LType from 'leaflet';
	import { Icon, Button } from '$lib/components/atoms';
	import { SearchFilter, Select } from '$lib/components/molecules';
	import { toast } from '$lib/stores/toast.svelte';
	import { MAP_MODES, MAP_MODE_OPTIONS, MAP_DEFAULT_EMAIL } from '$lib/constants/maps';
	import type { MapMode } from '$lib/constants/maps';

	let { location = $bindable(null) } = $props<{ location: { latitude: number; longitude: number } | null }>();

	let mapElement: HTMLElement;
	let map: LType.Map | undefined;
	let marker: LType.Marker | undefined;
	let currentLayer: any;
	let L: any;

	let currentMode = $state<MapMode>('standard');
	
	let searchQuery = $state('');
	let isSearching = $state(false);

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

			const initialLat = location?.latitude || -6.200000;
			const initialLng = location?.longitude || 106.816666;

			map = L.map(mapElement, { attributionControl: false }).setView([initialLat, initialLng], location ? 15 : 10);

			currentLayer = L.tileLayer(MAP_MODES[currentMode].url, { maxZoom: MAP_MODES[currentMode].maxZoom }).addTo(map);

			const attachDrag = (m: any) => {
				m.on('dragend', (ev: any) => {
					location = { latitude: ev.target.getLatLng().lat, longitude: ev.target.getLatLng().lng };
				});
			};

			if (location) {
				marker = L.marker([location.latitude, location.longitude], { draggable: true }).addTo(map);
				attachDrag(marker);
			}

			map?.on('click', (e: any) => {
				if (marker) {
					marker.setLatLng(e.latlng);
				} else {
					marker = L.marker(e.latlng, { draggable: true }).addTo(map!);
					attachDrag(marker);
				}
				location = { latitude: e.latlng.lat, longitude: e.latlng.lng };
			});
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

	async function searchLocation() {
		if (!searchQuery.trim()) return;
		
		isSearching = true;
		try {
			const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&email=${MAP_DEFAULT_EMAIL}`);
			const data = await res.json();
			
			if (data && data.length > 0) {
				const lat = parseFloat(data[0].lat);
				const lon = parseFloat(data[0].lon);
				
				map?.setView([lat, lon], 15);
				
				if (marker) {
					marker.setLatLng([lat, lon]);
				} else {
					marker = L.marker([lat, lon], { draggable: true }).addTo(map!);
					marker?.on('dragend', (ev: any) => {
						location = { latitude: ev.target.getLatLng().lat, longitude: ev.target.getLatLng().lng };
					});
				}
				
				location = { latitude: lat, longitude: lon };
			} else {
				toast.error('Lokasi tidak ditemukan');
			}
		} catch (err) {
			console.error(err);
			toast.error('Gagal mencari lokasi. Pastikan koneksi internet stabil.');
		} finally {
			isSearching = false;
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div class="-mb-2">
		<SearchFilter 
			bind:searchQuery={searchQuery} 
			placeholder="Cari lokasi (misal: Jakarta)" 
			debounceMs={1000} 
			onSearch={searchLocation} 
		/>
	</div>
	<div class="relative z-0 border-4 border-on-background">
		<div bind:this={mapElement} class="w-full h-[400px]"></div>
		<div class="absolute top-2 right-2 z-[1000] w-48">
			<Select 
				bind:value={currentMode} 
				options={MAP_MODE_OPTIONS}
				searchable={false}
				variant="small"
			/>
		</div>
	</div>
	{#if location}
		<p class="text-xs font-mono text-secondary mt-1">
			Terpilih: Lat {location.latitude.toFixed(6)}, Lng {location.longitude.toFixed(6)}
		</p>
	{/if}
	<p class="text-[10px] text-slate-400 mt-1">
		{@html MAP_MODES[currentMode].attribution}
	</p>
</div>
