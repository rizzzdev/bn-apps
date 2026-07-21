<script lang="ts">
	import { Icon } from '$lib/components/atoms';

	let {
		icon,
		iconBgColor = 'bg-secondary',
		iconTextColor = 'text-on-secondary',
		title,
		time,
		description,
		class: className = ''
	} = $props<{
		icon: string;
		iconBgColor?: string;
		iconTextColor?: string;
		title: string;
		time: string;
		description: string;
		class?: string;
	}>();
</script>

<div
	class="p-md border-on-background gap-md hover:bg-surface-variant flex items-start border-b-3 transition-colors {className}"
>
	<div
		class="p-xs rounded-lg border-on-background mt-1 border-3 shadow-neo-xs {iconBgColor} {iconTextColor}"
	>
		<Icon name={icon} class="text-xl" />
	</div>
	<div class="flex-1">
		<div class="mb-1 flex items-start justify-between">
			<span class="font-body-bold text-body-bold">{title}</span>
			<span class="font-label-sm text-label-sm text-on-surface-variant">{time}</span>
		</div>
		<p class="font-body-base text-body-base text-on-surface-variant">
			{description}
		</p>
	</div>
</div>
