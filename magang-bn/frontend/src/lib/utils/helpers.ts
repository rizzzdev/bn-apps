import type { User } from '$lib/types';

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
	prefixTitle?: string;
	suffixTitle?: string;
} | undefined | null): string {
	if (!person) return '';
	let nameStr = person.name || person.nama || '';
	if (person.prefixTitle) nameStr = `${person.prefixTitle} ${nameStr}`;
	if (person.suffixTitle) nameStr = `${nameStr}, ${person.suffixTitle}`;
	return nameStr;
}

export function paginate<T>(items: T[], page: number, perPage: number): T[] {
	return items.slice((page - 1) * perPage, page * perPage);
}
