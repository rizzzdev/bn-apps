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

/**
 * Store aplikasi bersifat cache in-memory saja (tidak memakai localStorage).
 * Sumber data utama adalah database melalui SSR `+page.server.ts` atau fetch
 * langsung ke API — sehingga daftar aplikasi tidak pernah kosong/stale hanya
 * karena localStorage browser kosong.
 */
function createAppsStore() {
	const { subscribe, set, update } = writable<AppItem[]>([]);

	return {
		subscribe,
		setApps: (apps: AppItem[]) => {
			set(apps);
		},
		setAppsFromApi: (apiApps: ApiApplication[]) => {
			set(apiApps.map(mapApiAppToAppItem));
		},
		addApp: (newApp: Omit<AppItem, 'id'>) => {
			update((apps) => {
				const id = 'app_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
				return [{ id, ...newApp }, ...apps];
			});
		},
		updateApp: (id: string, updatedData: Partial<Omit<AppItem, 'id'>>) => {
			update((apps) => apps.map((app) => (app.id === id ? { ...app, ...updatedData } : app)));
		},
		deleteApp: (id: string) => {
			update((apps) => apps.filter((app) => app.id !== id));
		},
		bulkDeleteApps: (ids: string[]) => {
			update((apps) => apps.filter((app) => !ids.includes(app.id)));
		},
		resetToDefault: () => {
			set([]);
		}
	};
}

export const appsStore = createAppsStore();
