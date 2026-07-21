import { writable } from 'svelte/store';

export interface Warning {
	id: number;
	message: string;
	fromName: string;
	timestamp: Date;
}

export const warnings = writable<Warning[]>([]);

let _idSeq = 0;

export function pushWarning(message: string, fromName: string): void {
	const w: Warning = { id: ++_idSeq, message, fromName, timestamp: new Date() };
	warnings.update((list) => [...list, w]);
}

export function dismissWarning(id: number): void {
	warnings.update((list) => list.filter((w) => w.id !== id));
}
