<script lang="ts">
	import { Icon, Button } from '../atoms';
	import { slide } from 'svelte/transition';
	
	type ToastType = 'success' | 'error' | 'info' | 'warning';
	let { message, type = 'success', show = $bindable(false), duration = 3000 } = $props<{ message: string, type?: ToastType, show?: boolean, duration?: number }>();
	
	let timeout: ReturnType<typeof setTimeout>;
	
	$effect(() => {
		if (show) {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				show = false;
			}, duration);
		}
		return () => clearTimeout(timeout);
	});
	
	const typeStyles: Record<ToastType, string> = {
		success: 'bg-green-400 text-on-background',
		error: 'bg-red-500 text-surface',
		warning: 'bg-yellow-400 text-on-background',
		info: 'bg-blue-400 text-on-background'
	};
	const typeIcons: Record<ToastType, string> = {
		success: 'check_circle',
		error: 'error',
		warning: 'warning',
		info: 'info'
	};
</script>

{#if show}
	<div transition:slide={{ duration: 300 }} class="fixed bottom-8 right-8 z-[999] flex items-center gap-3 px-6 py-4 border-4 border-on-background shadow-[6px_6px_0px_0px_#0f172a] {typeStyles[type as ToastType]} font-bold">
		<Icon name={typeIcons[type as ToastType]} class="text-xl" />
		<span class="font-mono text-sm uppercase tracking-tight">{message}</span>
		<Button variant="secondary" size="icon" onclick={() => show = false} class="ml-4">
			<Icon name="close" />
		</Button>
	</div>
{/if}
