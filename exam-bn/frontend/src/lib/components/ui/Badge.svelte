<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'default',
		size = 'md',
		class: className = '',
		children
	}: {
		variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'purple';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		children: Snippet;
	} = $props();

	const variantClass: Record<string, string> = {
		default: 'badge',
		success: 'badge badge-success',
		warning: 'badge badge-warning',
		danger: 'badge badge-danger',
		info: 'badge badge-info',
		primary: 'badge badge-primary',
		purple: 'badge badge-purple'
	};

	const sizeClass: Record<string, string> = {
		sm: '',
		md: '',
		lg: 'badge-lg'
	};
</script>

<span class="{variantClass[variant]} {sizeClass[size]} {className}">
	{@render children()}
</span>
