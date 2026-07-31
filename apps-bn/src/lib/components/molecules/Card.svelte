<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolveRoute } from '$app/paths';

	let {
		className = '',
		variant = 'default',
		href = '',
		icon = 'apps',
		children,
		header,
		footer
	}: {
		className?: string;
		variant?: 'default' | 'app';
		href?: string;
		icon?: string;
		children?: Snippet;
		header?: Snippet;
		footer?: Snippet;
	} = $props();

	let imageError = $state(false);
	let isImageIcon = $derived(icon && (icon.includes('/') || icon.includes('.')) && !imageError);
	let displayIcon = $derived(icon?.trim() || 'apps');

	let isExternalLink = $derived(
		Boolean(
			href &&
			(href.startsWith('http://') ||
				href.startsWith('https://') ||
				href.startsWith('//') ||
				(!href.startsWith('/') && !href.startsWith('#')))
		)
	);

	let formattedHref = $derived.by(() => {
		if (!href) return '#';
		if (
			href.startsWith('http://') ||
			href.startsWith('https://') ||
			href.startsWith('//') ||
			href.startsWith('/') ||
			href.startsWith('#')
		) {
			return href;
		}
		return `https://${href}`;
	});

	let resolvedHref = $derived(
		isExternalLink ? formattedHref : resolveRoute(formattedHref as Parameters<typeof resolveRoute>[0])
	);
</script>

{#if variant === 'app'}
	{#if href}
		<a
			href={resolvedHref}
			target={isExternalLink ? '_blank' : undefined}
			rel={isExternalLink ? 'noopener noreferrer' : undefined}
			class="bg-primary dark:bg-primary-container text-white border-2 md:border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] md:shadow-[4.5px_4.5px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4.5px_4.5px_0px_0px_rgba(251,228,15,1)] md:hover:shadow-[6px_6px_0px_0px_rgba(251,228,15,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full relative group rounded-xl overflow-hidden w-full max-w-full box-border p-4 md:p-4.5 justify-between no-underline {className}"
		>
			<!-- Top Row: Icon Badge -->
			<div class="flex justify-between items-center mb-3">
				<div class="w-8 h-8 md:w-9 md:h-9 bg-secondary-fixed text-black border-2 border-black rounded-lg flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] group-hover:scale-105 transition-transform overflow-hidden p-1">
					{#if isImageIcon}
						<img
							src={icon}
							alt="App icon"
							class="w-full h-full object-contain"
							onerror={() => (imageError = true)}
						/>
					{:else}
						<span class="material-symbols-outlined text-[17px] md:text-[20px] select-none">{displayIcon}</span>
					{/if}
				</div>
			</div>

			<!-- Main Content -->
			<div class="flex-grow flex flex-col justify-start my-0.5">
				{@render children?.()}
			</div>

			<!-- Bottom CTA -->
			<div class="pt-3 mt-1.5 border-t-2 border-white/20 flex items-center justify-between group-hover:border-secondary-fixed transition-colors">
				<span class="font-label-bold text-[10px] md:text-xs text-secondary-fixed uppercase tracking-wider group-hover:underline">
					MASUK APLIKASI
				</span>
				<div class="w-6.5 h-6.5 rounded-md bg-secondary-fixed text-black border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-0.5 transition-transform">
					<span class="material-symbols-outlined text-[14px]">{isExternalLink ? 'open_in_new' : 'arrow_forward'}</span>
				</div>
			</div>
		</a>
	{:else}
		<div class="bg-primary dark:bg-primary-container text-white border-2 md:border-3 border-black neobrutal-shadow flex flex-col h-full relative group rounded-xl overflow-hidden w-full max-w-full box-border p-4 md:p-4.5 justify-between {className}">
			<div class="flex-grow flex flex-col">
				{@render children?.()}
			</div>
			{#if footer}
				<div class="pt-3 border-t-2 border-white/20">
					{@render footer()}
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<div class="relative bg-surface-container-lowest rounded-xl neo-border neo-shadow p-4 md:p-4.5 flex flex-col gap-4 w-full max-w-full box-border {className}">
		{#if header}
			<div class="text-center pt-0.5 pb-3 border-b-2 border-black border-dashed">
				{@render header()}
			</div>
		{/if}
		<div>
			{@render children?.()}
		</div>
		{#if footer}
			<div>
				{@render footer()}
			</div>
		{/if}
	</div>
{/if}
