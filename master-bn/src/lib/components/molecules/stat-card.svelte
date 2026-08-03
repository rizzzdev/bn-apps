<script lang="ts">
	import { Icon, Badge } from '$lib/components/atoms';

	let {
		icon,
		iconColor = 'text-secondary',
		badgeText,
		badgeColor,
		title,
		value,
		bgIcon,
		bgIconClass,
		class: className = ''
	} = $props<{
		icon?: string;
		iconColor?: string;
		badgeText?: string;
		badgeColor?: string;
		title: string;
		value: string | number;
		bgIcon?: string;
		bgIconClass?: string;
		class?: string;
	}>();
</script>

<div
	class="bg-surface border-on-background p-4 flex flex-col justify-start border-3 rounded-xl shadow-neo relative overflow-hidden transition-transform hover:-translate-y-0.5 duration-200 {className}"
>
	{#if bgIcon}
		<div class="absolute -right-4 -top-4 opacity-10">
			<Icon name={bgIcon} class={bgIconClass || 'text-[80px] text-on-surface'} fill={1} />
		</div>
	{/if}

	{#if icon || badgeText}
		<div class="mb-3 flex items-start justify-between relative z-10">
			{#if icon}
				<div
					class="p-2 bg-surface border-2 border-on-background rounded-lg shadow-neo-xs flex items-center justify-center"
				>
					<Icon name={icon} class="{iconColor} text-xl" fill={1} />
				</div>
			{:else}
				<div></div>
			{/if}
			{#if badgeText}
				<Badge color={badgeColor} class="text-xs font-bold tracking-wider px-2 py-0.5"
					>{badgeText}</Badge
				>
			{/if}
		</div>
	{/if}

	<h3
		class="font-label-sm text-xs text-on-surface-variant font-bold uppercase tracking-wider relative z-10 mb-1"
	>
		{title}
	</h3>

	<p
		class="font-display-lg text-2xl md:text-3xl font-black tracking-tight text-on-surface relative z-10"
	>
		{value}
	</p>
</div>
