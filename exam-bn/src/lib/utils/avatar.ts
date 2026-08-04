import { resolveBackendUrl } from './backend-url';

/**
 * Returns uppercase initials of a full name (maximum 2 letters).
 * Fallback to 'SA' for empty/null values.
 *
 * Example:
 * - "Super Admin" -> "SA"
 * - "Budi Santoso" -> "BS"
 * - "Ahmad" -> "AH"
 * - "" / null / undefined -> "SA"
 */
export function getInitials(fullname?: string | null): string {
	if (!fullname) return 'SA';
	const cleaned = fullname.trim();
	if (!cleaned) return 'SA';
	const parts = cleaned.split(/\s+/).filter(Boolean);
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Resolves attachment picture URL pointing to master attachments endpoint.
 */
export function resolvePictureUrl(url?: string | null): string | null {
	if (!url) return null;
	const trimmed = url.trim();
	if (!trimmed) return null;
	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
	const baseUrl = resolveBackendUrl();
	const clean = trimmed.replace(/^\/+/, '');
	if (clean.startsWith('master/attachments/file/')) return `${baseUrl}/api/v1/${clean}`;
	if (clean.startsWith('api/v1/')) return `${baseUrl}/${clean}`;
	return `${baseUrl}/api/v1/master/attachments/file/${clean}`;
}

