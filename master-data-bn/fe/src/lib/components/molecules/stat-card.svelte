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
	class="bg-primary-container border-on-background p-md flex flex-col justify-between border-3 rounded-xl shadow-neo relative overflow-hidden {className}"
>
	{#if bgIcon}
		<div class="absolute -right-4 -top-4 opacity-10">
			<Icon name={bgIcon} class={bgIconClass || 'text-[100px] text-on-surface'} fill={1} />
		</div>
	{/if}

	{#if icon || badgeText}
		<div class="mb-lg flex items-start justify-between relative z-10">
			{#if icon}
				<div class="p-xs bg-surface border-on-background border-3 rounded-xl">
					<Icon name={icon} class={iconColor} fill={1} />
				</div>
			{:else}
				<div></div>
			{/if}
			{#if badgeText}
				<Badge color={badgeColor}>{badgeText}</Badge>
			{/if}
		</div>
	{/if}

	<h3 class="font-label-sm text-label-sm text-on-surface-variant uppercase relative z-10">
		{title}
	</h3>
	
	<p class="font-display-lg text-display-lg-mobile md:text-display-lg font-bold tracking-tighter text-on-surface relative z-10">
		{value}
	</p>
</div>
