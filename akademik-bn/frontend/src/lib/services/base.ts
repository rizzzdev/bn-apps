import { apiClient } from '$lib/utils/api';
import type { ApiResponse } from '$lib/types';

async function toJson<T>(res: Response): Promise<ApiResponse<T>> {
	return res.json();
}

export async function getList<T>(
	endpoint: string,
	params?: Record<string, string | number | undefined>
): Promise<ApiResponse<T[]>> {
	const searchParams = new URLSearchParams();
	if (params) {
		for (const [key, val] of Object.entries(params)) {
			if (val !== undefined && val !== '') searchParams.set(key, String(val));
		}
	}
	const qs = searchParams.toString();
	const res = await apiClient(`${endpoint}${qs ? `?${qs}` : ''}`);
	return toJson<T[]>(res);
}

export async function getById<T>(endpoint: string, id: string): Promise<ApiResponse<T>> {
	const res = await apiClient(`${endpoint}/${id}`);
	return toJson<T>(res);
}

export async function createItem<T, R>(endpoint: string, data: T): Promise<ApiResponse<R>> {
	const res = await apiClient(endpoint, {
		method: 'POST',
		body: JSON.stringify(data)
	});
	return toJson<R>(res);
}

export async function updateItem<T, R>(
	endpoint: string,
	id: string,
	data: T
): Promise<ApiResponse<R>> {
	const res = await apiClient(`${endpoint}/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	});
	return toJson<R>(res);
}

export async function deleteItem(endpoint: string, id: string): Promise<ApiResponse<null>> {
	const res = await apiClient(`${endpoint}/${id}`, { method: 'DELETE' });
	return toJson<null>(res);
}

export async function bulkCreate<T>(
	endpoint: string,
	data: T[]
): Promise<ApiResponse<{ created: number }>> {
	const res = await apiClient(`${endpoint}/bulk`, {
		method: 'POST',
		body: JSON.stringify({ data })
	});
	return toJson<{ created: number }>(res);
}

export async function bulkDelete(
	endpoint: string,
	ids: string[]
): Promise<ApiResponse<{ deleted: number }>> {
	const res = await apiClient(`${endpoint}/bulk`, {
		method: 'DELETE',
		body: JSON.stringify({ ids })
	});
	return toJson<{ deleted: number }>(res);
}

export async function bulkUpdateStatus(
	endpoint: string,
	ids: string[],
	status: string
): Promise<ApiResponse<{ updated: number }>> {
	const res = await apiClient(`${endpoint}/bulk/status`, {
		method: 'PATCH',
		body: JSON.stringify({ ids, status })
	});
	return toJson<{ updated: number }>(res);
}

export async function bulkAction<T>(
	endpoint: string,
	action: string,
	data: T
): Promise<ApiResponse<unknown>> {
	const res = await apiClient(`${endpoint}/${action}`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
	return toJson<unknown>(res);
}
