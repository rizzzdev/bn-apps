<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		href,
		class: className = '',
		onclick,
		children,
		icon,
		iconRight,
		title,
		'aria-label': ariaLabel
	}: {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'primary-outline' | 'danger-outline';
		size?: 'sm' | 'md' | 'lg' | 'icon';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		href?: string;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children: Snippet;
		icon?: Snippet;
		iconRight?: Snippet;
		title?: string;
		'aria-label'?: string;
	} = $props();

	const variantClass: Record<string, string> = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		danger: 'btn-danger',
		'primary-outline': 'btn-primary-outline',
		'danger-outline': 'btn-danger-outline',
		ghost:
			'inline-flex items-center justify-center gap-1.5 font-bold rounded-md cursor-pointer transition-colors duration-100 hover:bg-(--bg-secondary) text-(--text-primary) disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed'
	};

	const sizeClass: Record<string, string> = {
		sm: 'px-3 py-1 text-xs',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base',
		icon: 'p-2'
	};
</script>

{#if href}
	<a
		{href}
		{title}
		aria-label={ariaLabel}
		class="{variantClass[variant]} {sizeClass[size]} {className}"
		class:opacity-50={disabled}
		class:pointer-events-none={disabled}
		aria-disabled={disabled}
		{onclick}
	>
		{#if icon}{@render icon()}{/if}
		{@render children()}
		{#if iconRight}{@render iconRight()}{/if}
	</a>
{:else}
	<button
		{type}
		{title}
		aria-label={ariaLabel}
		disabled={disabled || loading}
		class="{variantClass[variant]} {sizeClass[size]} {className}"
		{onclick}
	>
		{#if loading}
			<svg
				class="animate-spin -ml-1 mr-2 h-4 w-4 shrink-0"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
			>
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		{:else if icon}
			{@render icon()}
		{/if}
		{@render children()}
		{#if iconRight && !loading}{@render iconRight()}{/if}
	</button>
{/if}
