<script lang="ts">
	import { TooltipIconButton } from '$lib/components/molecules';
	import type { Snippet } from 'svelte';

	let {
		title = '',
		name = '',
		code = '',
		backHref = '',
		class: className = '',
		children
	}: {
		title?: string;
		name?: string;
		code?: string;
		backHref?: string;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<div class="border-b-3 pb-4 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 {className}">
	<div>
		{#if backHref}
			<div class="mb-2">
				<TooltipIconButton icon="arrow_back" tooltip="Kembali" href={backHref} />
			</div>
		{/if}
		<h2 class="font-headline-lg text-2xl md:text-3xl text-primary-container font-black">
			{title}{#if name}: <span class="text-on-surface">{name}</span>{/if}
		</h2>
		{#if code}
			<div class="flex items-center gap-2 mt-2">
				<span class="bg-secondary text-on-secondary text-xs px-1.5 py-0.5 font-bold font-data-mono neo-border-xs">
					{code}
				</span>
			</div>
		{/if}
	</div>
	{#if children}
		<div class="flex items-center gap-3">
			{@render children()}
		</div>
	{/if}
</div>
