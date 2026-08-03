import { apiClient } from '$lib/utils/api';
import type { ApiResponse } from '$lib/types';

export async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
	const body: { message?: string; error?: string | boolean; [key: string]: unknown } | null =
		await res.json().catch(() => null);

	if (!res.ok) {
		const message =
			(typeof body?.message === 'string' && body.message) ||
			(typeof body?.error === 'string' && (body.error as string)) ||
			`Permintaan gagal (${res.status})`;
		const err = new Error(message) as Error & { status?: number; response?: unknown };
		err.status = res.status;
		err.response = { status: res.status, data: body };
		throw err;
	}

	return body as unknown as ApiResponse<T>;
}

const toJson = parseResponse;

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
		method: 'PUT',
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
	const res = await apiClient(`${endpoint}/batch`, {
		method: 'POST',
		body: JSON.stringify({ data })
	});
	return toJson<{ created: number }>(res);
}

export async function bulkDelete(
	endpoint: string,
	ids: string[]
): Promise<ApiResponse<{ deleted: number }>> {
	const res = await apiClient(`${endpoint}/batch`, {
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
	const res = await apiClient(`${endpoint}/batch/status`, {
		method: 'PATCH',
		body: JSON.stringify({ ids, status })
	});
	return toJson<{ updated: number }>(res);
}

export async function bulkUpdateTargetHours(
	endpoint: string,
	ids: string[],
	targetHours: number
): Promise<ApiResponse<{ updated: number }>> {
	const res = await apiClient(`${endpoint}/batch/target-hours`, {
		method: 'PATCH',
		body: JSON.stringify({ ids, targetHours })
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
