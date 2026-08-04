<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		type = 'info',
		class: className = '',
		children
	}: {
		type?: 'success' | 'error' | 'info' | 'warning';
		class?: string;
		children: Snippet;
	} = $props();

	const typeClass: Record<string, { alert: string; icon: string }> = {
		success: { alert: 'alert-success', icon: 'M5 13l4 4L19 7' },
		error: { alert: 'alert-error', icon: 'M6 18L18 6M6 6l12 12' },
		info: {
			alert: 'alert-info',
			icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
		},
		warning: {
			alert: 'alert-warning',
			icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
		}
	};

	const c = $derived(typeClass[type] ?? typeClass.info);
</script>

<div class="p-3 text-sm font-medium flex items-start gap-2 {c.alert} {className}">
	<svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={c.icon} />
	</svg>
	<div class="flex-1">
		{@render children()}
	</div>
</div>
