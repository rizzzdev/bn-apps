import type { User } from '$lib/types';
import { PUBLIC_API_URL } from '$env/static/public';

export function getAttachmentUrl(url: string | undefined | null): string {
	if (!url) return '';
	if (url.startsWith('http://') || url.startsWith('https://')) return url;
	let cleanPath = url;
	if (cleanPath.startsWith('/api/v1/')) {
		cleanPath = cleanPath.replace('/api/v1/', '/');
	}
	if (!cleanPath.startsWith('/')) {
		cleanPath = '/' + cleanPath;
	}
	const raw = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
	const baseUrl = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
	return `${baseUrl}/internship${cleanPath}`;
}


export function getEmailFromUser(user: User | undefined | null): string | undefined {
	return user?.identifiers?.find((i) => i.type === 'email')?.value ?? user?.email;
}

export function getWIBDate(date?: Date): string {
	return (date ?? new Date()).toLocaleString('en-CA', { timeZone: 'Asia/Jakarta' }).slice(0, 10);
}

export function getWIBTime(isoString: string): string {
	const date = new Date(isoString);
	return date.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
}

export function formatFullName(person: {
	name?: string;
	nama?: string;
	fullname?: string;
	prefixTitle?: string;
	suffixTitle?: string;
} | undefined | null): string {
	if (!person) return '';
	let nameStr = person.name || person.nama || person.fullname || '';
	if (person.prefixTitle) nameStr = `${person.prefixTitle} ${nameStr}`;
	if (person.suffixTitle) nameStr = `${nameStr}, ${person.suffixTitle}`;
	return nameStr;
}

export function paginate<T>(items: T[], page: number, perPage: number): T[] {
	return items.slice((page - 1) * perPage, page * perPage);
}

export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("id-ID", {
		day: "numeric", month: "short", year: "numeric",
	});
}

export function formatDateShort(iso: string): string {
	return new Date(iso).toLocaleDateString("id-ID", {
		day: "numeric", month: "short",
	});
}

export function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString("id-ID", {
		hour: "2-digit", minute: "2-digit",
	});
}

export function formatDateRange(start: string, end: string): string {
	if (!start || !end) return "-";
	const opts: Intl.DateTimeFormatOptions = {
		day: "numeric", month: "short", year: "numeric",
	};
	const s = new Date(start).toLocaleDateString("id-ID", opts);
	const e = new Date(end).toLocaleDateString("id-ID", opts);
	return `${s} - ${e}`;
}

export function formatBytesToMB(bytes: number): string {
	return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export function formatDateString(date: string | undefined): string {
	if (!date) return "";
	return new Date(date).toLocaleDateString("id-ID", {
		weekday: "short", day: "numeric", month: "short", year: "numeric",
	});
}
