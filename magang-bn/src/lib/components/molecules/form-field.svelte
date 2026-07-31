<script lang="ts">
	import type { Snippet } from 'svelte';
	
	let {
		label,
		id,
		error,
		children
	} = $props<{
		label: string;
		id: string;
		error?: string;
		children?: Snippet;
	}>();
</script>

<div class="space-y-1 w-full">
	<label for={id} class="block font-mono text-[10px] text-on-background font-bold uppercase tracking-widest">
		{label}
	</label>
	
	{#if children}
		{@render children()}
	{/if}
	
	{#if error}
		<p class="text-error font-body text-[9px] mt-1 font-semibold">{error}</p>
	{/if}
</div>
