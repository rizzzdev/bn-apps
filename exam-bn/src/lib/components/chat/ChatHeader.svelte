<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle = '',
		onBack,
		onClose,
		right
	}: {
		title: string;
		subtitle?: string;
		onBack?: () => void;
		onClose?: () => void;
		right?: Snippet;
	} = $props();
</script>

<div
	class="flex items-center gap-2 px-3 py-3 shrink-0"
	style="background-color:var(--nb-border); border-bottom:2px solid var(--nb-border);"
>
	{#if onBack}
		<button
			class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all duration-100 hover:opacity-70"
			style="color:var(--nb-card-bg);"
			onclick={onBack}
			aria-label="Kembali"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
		</button>
	{:else}
		<svg
			class="w-4 h-4 shrink-0"
			style="color:var(--nb-card-bg);"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
			/>
		</svg>
	{/if}

	<div class="min-w-0 flex-1">
		<p class="text-sm font-black uppercase tracking-wide truncate" style="color:var(--nb-card-bg);">
			{title}
		</p>
		{#if subtitle}
			<p
				class="text-xs font-bold truncate"
				style="color:color-mix(in srgb, var(--nb-card-bg) 70%, transparent);"
			>
				{subtitle}
			</p>
		{/if}
	</div>

	{#if right}{@render right()}{/if}

	{#if onClose}
		<button
			class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center font-black text-lg leading-none transition-all duration-100 hover:opacity-70"
			style="color:var(--nb-card-bg);"
			onclick={onClose}
			aria-label="Tutup">×</button
		>
	{/if}
</div>
