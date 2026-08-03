<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import { resolve } from '$app/paths';

	import type { Snippet } from 'svelte';

	let {
		href = '#',
		icon,
		active = false,
		children,
		class: className = '',
		onclick
	} = $props<{
		href?: string;
		icon: string;
		active?: boolean;
		children?: Snippet;
		class?: string;
		onclick?: (e: MouseEvent) => void;
	}>();

	const baseClasses =
		'gap-1 px-1.5 py-0.5 font-body-bold text-[11px] font-bold flex items-center transition-all';
	const activeClasses =
		'bg-secondary text-on-secondary border-on-background border-2 rounded-md shadow-neo-xs';
	const inactiveClasses =
		'text-on-surface border-on-background hover:bg-surface-container-high border-b-2 rounded-md';
</script>

<a
	href={href?.startsWith('http') ? href : resolve(href)}
	{onclick}
	target={href?.startsWith('http') ? '_blank' : undefined}
	rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
	class="{baseClasses} {active ? activeClasses : inactiveClasses} {className}"
>
	<Icon name={icon} class="text-xs" />
	{@render children?.()}
</a>
