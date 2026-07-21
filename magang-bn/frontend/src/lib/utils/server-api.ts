import { PUBLIC_API_URL } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';
import type { ApiResponse } from '$lib/types';

function getToken(cookies: RequestEvent['cookies']): string | undefined {
	return cookies.get('access_token') ?? undefined;
}

function buildHeaders(cookies: RequestEvent['cookies']): Record<string, string> {
	const token = getToken(cookies);
	return {
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
}

export async function fetchApi<T>(
	path: string,
	event: { fetch: typeof fetch; cookies: RequestEvent['cookies'] },
	options: RequestInit & { params?: Record<string, string | number | undefined> } = {},
): Promise<{ data?: T; error?: string; pagination?: ApiResponse<T>['pagination'] }> {
	const { params, ...fetchOptions } = options;

	let url = `${PUBLIC_API_URL}${path}`;
	if (params) {
		const searchParams = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null && value !== '') {
				searchParams.set(key, String(value));
			}
		}
		const qs = searchParams.toString();
		if (qs) url += `?${qs}`;
	}

	try {
		const res = await event.fetch(url, {
			...fetchOptions,
			headers: {
				...buildHeaders(event.cookies),
				...((fetchOptions.headers as Record<string, string>) || {}),
			},
		});

		if (!res.ok) {
			console.error(`fetchApi error ${res.status} for ${path}`);
			return { error: `HTTP ${res.status}` };
		}

		const result: ApiResponse<T> = await res.json();
		if (result.error) {
			return { error: result.message || 'API error' };
		}
		return { data: result.data, pagination: result.pagination };
	} catch (e) {
		console.error(`fetchApi failed for ${path}:`, e);
		return { error: String(e) };
	}
}

export async function fetchList<T>(
	path: string,
	event: { fetch: typeof fetch; cookies: RequestEvent['cookies'] },
	params: Record<string, string | number | undefined> = {},
): Promise<{ data: T[]; pagination: ApiResponse<T>['pagination'] }> {
	const result = await fetchApi<T[]>(path, event, {
		params: { limit: 1000, ...params },
	});
	return {
		data: result.data ?? [],
		pagination: result.pagination,
	};
}

export function getStudentFilters(
	placements: { studentId: string; student?: { name?: string; nama?: string } }[],
): { label: string; value: string }[] {
	const seen = new Set<string>();
	return placements
		.filter((p) => {
			if (!p.studentId || seen.has(p.studentId)) return false;
			seen.add(p.studentId);
			return true;
		})
		.map((p) => ({
			label: p.student?.name || p.student?.nama || p.studentId,
			value: p.studentId,
		}));
}

export function getCompanyFilters(
	placements: { companyId: string; company?: { name?: string; nama?: string } }[],
): { label: string; value: string }[] {
	const seen = new Set<string>();
	return placements
		.filter((p) => {
			if (!p.companyId || seen.has(p.companyId)) return false;
			seen.add(p.companyId);
			return true;
		})
		.map((p) => ({
			label: p.company?.name || p.company?.nama || p.companyId,
			value: p.companyId,
		}));
}
