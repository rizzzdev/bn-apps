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
		isExternalLink
			? formattedHref
			: resolveRoute(formattedHref as Parameters<typeof resolveRoute>[0])
	);
</script>

{#if variant === 'app'}
	{#if href}
		<a
			href={resolvedHref}
			target={isExternalLink ? '_blank' : undefined}
			rel={isExternalLink ? 'noopener noreferrer' : undefined}
			class="group relative box-border flex h-full w-full max-w-full flex-col justify-between overflow-hidden rounded-xl border-2 border-black bg-primary p-4 text-white no-underline shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4.5px_4.5px_0px_0px_rgba(251,228,15,1)] md:border-3 md:p-4.5 md:shadow-[4.5px_4.5px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[6px_6px_0px_0px_rgba(251,228,15,1)] dark:bg-primary-container {className}"
		>
			<!-- Top Row: Icon Badge -->
			<div class="mb-3 flex items-center justify-between">
				<div
					class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border-2 border-black bg-secondary-fixed p-1 text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:scale-105 md:h-9 md:w-9"
				>
					{#if isImageIcon}
						<img
							src={icon}
							alt="App icon"
							class="h-full w-full object-contain"
							onerror={() => (imageError = true)}
						/>
					{:else}
						<span class="material-symbols-outlined text-[17px] select-none md:text-[20px]"
							>{displayIcon}</span
						>
					{/if}
				</div>
			</div>

			<!-- Main Content -->
			<div class="my-0.5 flex flex-grow flex-col justify-start">
				{@render children?.()}
			</div>

			<!-- Bottom CTA -->
			<div
				class="mt-1.5 flex items-center justify-between border-t-2 border-white/20 pt-3 transition-colors group-hover:border-secondary-fixed"
			>
				<span
					class="font-label-bold text-[10px] tracking-wider text-secondary-fixed uppercase group-hover:underline md:text-xs"
				>
					MASUK APLIKASI
				</span>
				<div
					class="flex h-6.5 w-6.5 items-center justify-center rounded-md border-2 border-black bg-secondary-fixed text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:translate-x-0.5"
				>
					<span class="material-symbols-outlined text-[14px]"
						>{isExternalLink ? 'open_in_new' : 'arrow_forward'}</span
					>
				</div>
			</div>
		</a>
	{:else}
		<div
			class="neobrutal-shadow group relative box-border flex h-full w-full max-w-full flex-col justify-between overflow-hidden rounded-xl border-2 border-black bg-primary p-4 text-white md:border-3 md:p-4.5 dark:bg-primary-container {className}"
		>
			<div class="flex flex-grow flex-col">
				{@render children?.()}
			</div>
			{#if footer}
				<div class="border-t-2 border-white/20 pt-3">
					{@render footer()}
				</div>
			{/if}
		</div>
	{/if}
{:else}
	<div
		class="neo-border neo-shadow relative box-border flex w-full max-w-full flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 md:p-4.5 {className}"
	>
		{#if header}
			<div class="border-b-2 border-dashed border-black pt-0.5 pb-3 text-center">
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
