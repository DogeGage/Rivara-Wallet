import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'dark' | 'light';

const stored = browser ? localStorage.getItem('theme') as Theme : 'dark';
export const theme = writable<Theme>(stored || 'dark');

theme.subscribe((value) => {
	if (browser) {
		localStorage.setItem('theme', value);
		document.documentElement.setAttribute('data-theme', value);
		
		// Toggle Tailwind dark mode class
		if (value === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}
});
