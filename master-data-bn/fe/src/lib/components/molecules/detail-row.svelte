<script lang="ts">
	let {
		label,
		value,
		class: className = ''
	} = $props<{
		label: string;
		value?: string | number | null;
		class?: string;
	}>();
</script>

<div class="flex flex-col sm:flex-row sm:items-start py-sm border-b-3 border-on-background/20 gap-xs sm:gap-md {className}">
	<div class="sm:w-1/3 md:w-1/4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wide">
		{label}
	</div>
	<div class="sm:w-2/3 md:w-3/4 font-body-lg text-body-lg text-on-surface font-medium break-words">
		{#if value !== undefined && value !== null && value !== ''}
			{value}
		{:else}
			<span class="text-on-surface-variant/50 italic">-</span>
		{/if}
	</div>
</div>
