import { writable } from 'svelte/store';

export interface AppItem {
	id: string;
	title: string;
	description: string;
	href: string;
	icon: string;
	order: number | null;
}

export interface ApiApplication {
	id: string;
	title: string;
	description: string;
	materialIcon: string;
	link: string;
	order?: number | null;
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string | null;
}

export function mapApiAppToAppItem(apiApp: ApiApplication): AppItem {
	return {
		id: apiApp.id,
		title: apiApp.title,
		description: apiApp.description || '',
		icon: apiApp.materialIcon || 'apps',
		href: apiApp.link || '/',
		order: apiApp.order ?? null
	};
}

export function mapAppItemToApiPayload(app: Partial<AppItem>) {
	const payload: Record<string, string | number | null> = {};
	if (app.title !== undefined) payload.title = app.title;
	if (app.description !== undefined) payload.description = app.description;
	if (app.icon !== undefined) payload.materialIcon = app.icon;
	if (app.href !== undefined) payload.link = app.href;
	if (app.order !== undefined) payload.order = app.order;
	return payload;
}

const STORAGE_KEY = 'bn_apps_list';

function loadInitialApps(): AppItem[] {
	if (typeof window !== 'undefined') {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					return parsed;
				}
			}
		} catch (e) {
			console.error('Failed to load apps from localStorage', e);
		}
	}
	return [];
}

function createAppsStore() {
	const { subscribe, set, update } = writable<AppItem[]>(loadInitialApps());

	function saveToStorage(apps: AppItem[]) {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
			} catch (e) {
				console.error('Failed to save apps to localStorage', e);
			}
		}
	}

	return {
		subscribe,
		setApps: (apps: AppItem[]) => {
			set(apps);
			saveToStorage(apps);
		},
		setAppsFromApi: (apiApps: ApiApplication[]) => {
			const mapped = apiApps.map(mapApiAppToAppItem);
			set(mapped);
			saveToStorage(mapped);
		},
		addApp: (newApp: Omit<AppItem, 'id'>) => {
			update((apps) => {
				const id = 'app_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
				const updated = [{ id, ...newApp }, ...apps];
				saveToStorage(updated);
				return updated;
			});
		},
		updateApp: (id: string, updatedData: Partial<Omit<AppItem, 'id'>>) => {
			update((apps) => {
				const updated = apps.map((app) => (app.id === id ? { ...app, ...updatedData } : app));
				saveToStorage(updated);
				return updated;
			});
		},
		deleteApp: (id: string) => {
			update((apps) => {
				const updated = apps.filter((app) => app.id !== id);
				saveToStorage(updated);
				return updated;
			});
		},
		bulkDeleteApps: (ids: string[]) => {
			update((apps) => {
				const updated = apps.filter((app) => !ids.includes(app.id));
				saveToStorage(updated);
				return updated;
			});
		},
		resetToDefault: () => {
			set([]);
			saveToStorage([]);
		}
	};
}

export const appsStore = createAppsStore();
