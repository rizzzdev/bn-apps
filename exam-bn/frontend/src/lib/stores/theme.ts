import { browser } from '$app/environment';
import { writable } from 'svelte/store';

function getInitialTheme(): 'dark' | 'light' {
	if (browser) {
		const saved = localStorage.getItem('theme');
		if (saved === 'light') return 'light';
	}
	return 'dark';
}

export const theme = writable<'dark' | 'light'>(getInitialTheme());

export function toggleTheme() {
	theme.update((current) => {
		const next = current === 'dark' ? 'light' : 'dark';
		if (browser) {
			localStorage.setItem('theme', next);
			document.documentElement.classList.toggle('dark', next === 'dark');
		}
		return next;
	});
}
