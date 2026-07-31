export const MAP_MODES = {
	standard: {
		name: 'Standar (OSM)',
		url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		maxZoom: 19,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" class="hover:underline">OpenStreetMap</a> contributors'
	},
	satellite: {
		name: 'Satelit (Esri)',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
		maxZoom: 19,
		attribution: '&copy; <a href="https://www.esri.com/" target="_blank" class="hover:underline">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
	},
	topo: {
		name: 'Topografi',
		url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
		maxZoom: 17,
		attribution: '&copy; OpenStreetMap contributors | &copy; OpenTopoMap (CC-BY-SA)'
	},
	cartoLight: {
		name: 'Carto Light',
		url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
		maxZoom: 20,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
	},
	cartoDark: {
		name: 'Carto Dark',
		url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
		maxZoom: 20,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OSM</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>'
	}
} as const;

export type MapMode = keyof typeof MAP_MODES;
export const MAP_MODE_OPTIONS = Object.entries(MAP_MODES).map(([key, mode]) => ({ label: mode.name, value: key }));

export const MAP_INITIAL_CENTER = [-7.250445, 112.768845] as const;
export const MAP_INITIAL_ZOOM = 13;
export const MAP_DEFAULT_EMAIL = 'admin@magang-bn.local';

export const INTERNSHIP_STATUS_OPTIONS = [
	{ value: "Semua Status", label: "Semua Status" },
	{ value: "Aktif", label: "Aktif" },
	{ value: "Selesai", label: "Selesai" },
	{ value: "Batal", label: "Batal" },
	{ value: "Berhenti", label: "Berhenti" },
];

export const INTERNSHIP_STATUS_MAP: Record<string, string> = {
	Aktif: "active",
	Selesai: "completed",
	Batal: "cancelled",
	Berhenti: "discontinued",
};
