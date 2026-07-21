<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		exam,
		room,
		variant,
		timeText,
		stat,
		extra,
		footer,
		href
	}: {
		exam?: { name?: string } | null;
		room?: { name?: string } | null;
		variant: 'active' | 'upcoming' | 'finished';
		timeText?: string;
		stat?: Snippet;
		extra?: Snippet;
		footer?: Snippet;
		href?: string;
	} = $props();

	const variantClass: Record<typeof variant, string> = {
		active: 'card-success',
		upcoming: 'card-primary',
		finished: 'card opacity-80'
	};
</script>

{#snippet body()}
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<p class="font-black text-(--text-primary) truncate">{exam?.name ?? '-'}</p>
			<p class="text-sm font-medium text-(--text-secondary) mt-0.5">{room?.name ?? '-'}</p>
			{#if timeText}
				<p class="text-xs text-(--text-secondary) mt-1">{timeText}</p>
			{/if}
			{#if extra}{@render extra()}{/if}
		</div>
		{#if stat}
			<div class="shrink-0 text-right">{@render stat()}</div>
		{/if}
	</div>
	{#if footer}{@render footer()}{/if}
{/snippet}

{#if href}
	<a {href} class="{variantClass[variant]} p-5 flex flex-col gap-3 block">
		{@render body()}
	</a>
{:else}
	<div class="{variantClass[variant]} p-5 flex flex-col gap-3">
		{@render body()}
	</div>
{/if}
