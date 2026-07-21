<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'secondary',
		title,
		href,
		disabled = false,
		loading = false,
		onclick,
		type = 'button',
		class: className = '',
		children
	}: {
		variant?: 'primary' | 'secondary' | 'danger' | 'primary-outline' | 'danger-outline';
		title?: string;
		href?: string;
		disabled?: boolean;
		loading?: boolean;
		onclick?: (e: MouseEvent) => void;
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		children: Snippet;
	} = $props();

	const variantClass: Record<string, string> = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		danger: 'btn-danger',
		'primary-outline': 'btn-primary-outline',
		'danger-outline': 'btn-danger-outline'
	};
</script>

{#if href}
	<a
		{href}
		{title}
		class="{variantClass[variant]} p-2 {className}"
		class:opacity-50={disabled}
		class:pointer-events-none={disabled}
		aria-disabled={disabled}
		{onclick}
	>
		{@render children()}
	</a>
{:else}
	<button
		{type}
		{title}
		disabled={disabled || loading}
		class="{variantClass[variant]} p-2 {className}"
		{onclick}
	>
		{#if loading}
			<svg
				class="animate-spin h-4 w-4"
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
		{:else}
			{@render children()}
		{/if}
	</button>
{/if}
