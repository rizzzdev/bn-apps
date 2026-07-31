<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		value,
		children,
		class: className = ''
	} = $props<{
		label: string;
		value: string;
		children?: Snippet;
		class?: string;
	}>();
</script>

<div
	class="bg-tertiary-fixed neo-border neo-shadow p-4 flex flex-col justify-between h-28 {className}"
>
	<div class="flex items-start justify-between">
		<span
			class="font-data-mono text-xs uppercase font-bold text-on-surface-variant neo-border-b pb-2"
		>
			{label}
		</span>
		{#if children}
			{@render children()}
		{/if}
	</div>
	<div class="font-headline-xl text-2xl text-primary font-black">{value}</div>
</div>
