<script lang="ts">
	import { Icon } from '$lib/components/atoms';

	let {
		icon,
		tooltip,
		onclick,
		href,
		badgeCount = 0,
		variant = 'default',
		size = '16px',
		position = 'top-left',
		class: customClass = ''
	} = $props<{
		icon: string;
		tooltip: string;
		onclick?: (e: MouseEvent) => void;
		href?: string;
		badgeCount?: number;
		variant?: 'default' | 'primary' | 'danger' | 'ghost';
		size?: string;
		position?: 'top-left' | 'left' | 'top';
		class?: string;
	}>();

	const variantClasses = {
		default: 'bg-surface hover:bg-surface-container text-on-surface',
		primary:
			'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container',
		danger: 'bg-error text-on-error hover:bg-error-container hover:text-on-error-container',
		ghost: 'bg-transparent hover:bg-surface-container-high text-on-surface'
	};

	const positionClasses = {
		'top-left': '-top-10 right-0 after:right-3.5 after:top-full after:border-t-on-background',
		left: '-top-1 right-full mr-2.5 after:left-full after:top-2.5 after:border-l-on-background',
		top: '-top-10 left-1/2 -translate-x-1/2 after:left-1/2 after:-translate-x-1/2 after:top-full after:border-t-on-background'
	};
</script>

{#if href}
	<a
		{href}
		class="relative group/tooltip inline-flex items-center justify-center w-8 h-8 neo-border neo-shadow-xs transition-all hover:translate-x-0.5 hover:translate-y-0.5 shrink-0 {variantClasses[
			variant as keyof typeof variantClasses
		]} {customClass}"
		aria-label={tooltip}
	>
		<Icon name={icon} {size} />
		{#if badgeCount > 0}
			<span
				class="absolute -top-1.5 -right-1.5 bg-error text-on-error px-1.5 py-0.5 font-bold font-data-mono text-[10px] neo-border-xs"
			>
				{badgeCount}
			</span>
		{/if}
		<!-- Tooltip -->
		<div
			class="absolute pointer-events-none opacity-0 group-hover/tooltip:opacity-100 group-hover/tooltip:-translate-y-0.5 transition-all duration-200 z-50 whitespace-nowrap bg-on-background text-surface text-xs font-bold font-data-mono px-2.5 py-1 neo-border-xs shadow-[2px_2px_0px_0px_#000] after:content-[''] after:absolute after:border-4 after:border-transparent {positionClasses[
				position as keyof typeof positionClasses
			]}"
		>
			{tooltip}
		</div>
	</a>
{:else}
	<button
		type="button"
		{onclick}
		class="relative group/tooltip inline-flex items-center justify-center w-8 h-8 neo-border neo-shadow-xs transition-all hover:translate-x-0.5 hover:translate-y-0.5 shrink-0 {variantClasses[
			variant as keyof typeof variantClasses
		]} {customClass}"
		aria-label={tooltip}
	>
		<Icon name={icon} {size} />
		{#if badgeCount > 0}
			<span
				class="absolute -top-1.5 -right-1.5 bg-error text-on-error px-1.5 py-0.5 font-bold font-data-mono text-[10px] neo-border-xs"
			>
				{badgeCount}
			</span>
		{/if}
		<!-- Tooltip -->
		<div
			class="absolute pointer-events-none opacity-0 group-hover/tooltip:opacity-100 group-hover/tooltip:-translate-y-0.5 transition-all duration-200 z-50 whitespace-nowrap bg-on-background text-surface text-xs font-bold font-data-mono px-2.5 py-1 neo-border-xs shadow-[2px_2px_0px_0px_#000] after:content-[''] after:absolute after:border-4 after:border-transparent {positionClasses[
				position as keyof typeof positionClasses
			]}"
		>
			{tooltip}
		</div>
	</button>
{/if}
