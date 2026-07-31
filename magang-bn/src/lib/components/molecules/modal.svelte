<script lang="ts">
	import { Icon, Button } from '../atoms';
	import { fade, scale } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	
	let { show = $bindable(false), title, children } = $props<{ show: boolean, title: string, children: Snippet }>();
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div transition:fade={{duration: 200}} class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onclick={(e) => { if (e.target === e.currentTarget) show = false; }}>
		<div transition:scale={{duration: 200, start: 0.95}} class="bg-surface border-2 border-on-background shadow-[6px_6px_0px_0px_#0f172a] w-full max-w-sm flex flex-col max-h-[90vh]">
			<div class="flex items-center justify-between border-b-2 border-on-background p-3 bg-primary text-on-background">
				<h3 class="font-headline font-black text-sm uppercase tracking-tight">{title}</h3>
				<Button variant="secondary" size="icon" onclick={() => show = false}>
					<Icon name="close" class="text-[10px]" />
				</Button>
			</div>
			<div class="p-4 overflow-y-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
