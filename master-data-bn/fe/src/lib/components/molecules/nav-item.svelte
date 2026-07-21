<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	
	import type { Snippet } from 'svelte';

	let {
		href = '#',
		icon,
		active = false,
		children,
		class: className = ''
	} = $props<{
		href?: string;
		icon: string;
		active?: boolean;
		children?: Snippet;
		class?: string;
	}>();

	const baseClasses = "gap-sm px-sm py-xs font-body-bold text-body-bold flex items-center transition-colors";
	const activeClasses = "bg-secondary text-on-secondary border-on-background border-3 rounded-lg shadow-neo-sm";
	const inactiveClasses = "text-on-surface border-on-background hover:bg-surface-container-high border-b-3 rounded-lg";
</script>

<a
	{href}
	class="{baseClasses} {active ? activeClasses : inactiveClasses} {className}"
>
	<Icon name={icon} /> 
	{@render children?.()}
</a>
