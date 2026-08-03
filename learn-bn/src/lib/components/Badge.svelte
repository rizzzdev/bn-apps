<script lang="ts">
	import type { Snippet } from 'svelte';

	export type BadgeVariant =
		| 'primary'
		| 'secondary'
		| 'success'
		| 'warning'
		| 'error'
		| 'info'
		| 'neutral'
		| 'outline';

	export type BadgeSize = 'xs' | 'sm' | 'md';

	let {
		children,
		text,
		variant = 'primary',
		size = 'sm',
		icon,
		class: className = ''
	} = $props<{
		children?: Snippet;
		text?: string;
		variant?: BadgeVariant;
		size?: BadgeSize;
		icon?: string;
		class?: string;
	}>();

	let variantClass = $derived(
		variant === 'primary'
			? 'bg-primary text-on-primary'
			: variant === 'secondary'
				? 'bg-secondary text-on-secondary'
				: variant === 'success'
					? 'bg-[#10B981] text-white'
					: variant === 'warning'
						? 'bg-[#F59E0B] text-slate-950 font-black'
						: variant === 'error'
							? 'bg-[#EF4444] text-white'
							: variant === 'info'
								? 'bg-[#06B6D4] text-slate-950 font-black'
								: variant === 'neutral'
									? 'bg-surface-container-high text-on-surface'
									: 'bg-white text-slate-950'
	);

	// Compact badge sizes matching major badge style in class cards
	let sizeClass = $derived(
		size === 'xs'
			? 'text-[10px] px-1.5 py-0.5 gap-1'
			: size === 'md'
				? 'text-xs px-2.5 py-1 gap-1.5'
				: 'text-[11px] px-2 py-0.5 gap-1' // Default sm size matches class card major badge!
	);

	let iconSizeClass = $derived(
		size === 'xs' ? 'text-[11px]' : size === 'md' ? 'text-[14px]' : 'text-[12px]'
	);
</script>

<span
	class="inline-flex items-center justify-center font-label-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider select-none shrink-0 leading-none {variantClass} {sizeClass} {className}"
>
	{#if icon}
		<span class="material-symbols-outlined {iconSizeClass} shrink-0">{icon}</span>
	{/if}
	{#if text}
		{text}
	{:else if children}
		{@render children()}
	{/if}
</span>
