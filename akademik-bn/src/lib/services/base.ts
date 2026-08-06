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
	return parseResponse<T[]>(res);
}

export async function getById<T>(endpoint: string, id: string): Promise<ApiResponse<T>> {
	const res = await apiClient(`${endpoint}/${id}`);
	return parseResponse<T>(res);
}

export async function createItem<T, R>(endpoint: string, data: T): Promise<ApiResponse<R>> {
	const res = await apiClient(endpoint, {
		method: 'POST',
		body: JSON.stringify(data)
	});
	return parseResponse<R>(res);
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
	return parseResponse<R>(res);
}

export async function deleteItem(endpoint: string, id: string): Promise<ApiResponse<null>> {
	const res = await apiClient(`${endpoint}/${id}`, { method: 'DELETE' });
	return parseResponse<null>(res);
}

export async function bulkCreate<T>(
	endpoint: string,
	data: T[]
): Promise<ApiResponse<{ created: number }>> {
	const res = await apiClient(`${endpoint}/batch`, {
		method: 'POST',
		body: JSON.stringify({ data })
	});
	return parseResponse<{ created: number }>(res);
}

export async function bulkDelete(
	endpoint: string,
	ids: string[]
): Promise<ApiResponse<{ deleted: number }>> {
	const res = await apiClient(`${endpoint}/batch`, {
		method: 'DELETE',
		body: JSON.stringify({ ids })
	});
	return parseResponse<{ deleted: number }>(res);
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
	return parseResponse<{ updated: number }>(res);
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
	return parseResponse<{ updated: number }>(res);
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
	return parseResponse<unknown>(res);
}

/** Upload file Excel ke endpoint `POST /{resource}/batch/excel` (multipart field "file"). */
export async function uploadExcel<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
	const fd = new FormData();
	fd.append('file', file);
	const res = await apiClient(endpoint, { method: 'POST', body: fd });
	return parseResponse<T>(res);
}

/** Unduh template Excel dari `GET /{resource}/template` dan simpan ke disk. */
export async function downloadExcel(endpoint: string, filename: string): Promise<void> {
	const res = await apiClient(endpoint);
	// parseResponse melempar Error dengan message dari server bila gagal.
	if (!res.ok) await parseResponse(res);
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
