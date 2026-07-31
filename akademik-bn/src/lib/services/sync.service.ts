import { apiClient } from '$lib/utils/api';

export const syncApi = {
	syncAll: async () => {
		const res = await apiClient('/academic/shadow-sync', { method: 'POST' });
		if (!res.ok) {
			throw new Error('Gagal menyelaraskan database shadow');
		}
		const json = await res.json();
		return json.data as { module: string; upserted: number }[];
	}
};
