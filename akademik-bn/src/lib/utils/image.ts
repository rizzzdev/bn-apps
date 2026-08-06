import { getApiBaseUrl } from '$lib/utils/env';

export function getPictureUrl(path: string | null | undefined): string | null {
	if (!path) return null;
	if (path.startsWith('http://') || path.startsWith('https://')) {
		return path;
	}
	return `${getApiBaseUrl()}/master/attachments/file/${path}`;
}

export function getInitials(name: string | null | undefined): string {
	if (!name) return '??';
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '??';
	if (parts.length === 1) {
		return parts[0].substring(0, 2).toUpperCase();
	}
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatTeacherName(
	teacher:
		| { fullname?: string | null; prefixTitle?: string | null; suffixTitle?: string | null }
		| null
		| undefined
): string {
	if (!teacher || !teacher.fullname) return '-';
	const prefix =
		teacher.prefixTitle && teacher.prefixTitle.trim() ? `${teacher.prefixTitle.trim()} ` : '';
	const suffix =
		teacher.suffixTitle && teacher.suffixTitle.trim() ? `, ${teacher.suffixTitle.trim()}` : '';
	return `${prefix}${teacher.fullname.trim()}${suffix}`;
}
