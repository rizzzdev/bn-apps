<script lang="ts">
	import { Icon } from '$lib/components/atoms';

	let {
		tabs = [],
		activeTab = $bindable(),
		class: className = ''
	} = $props<{
		tabs: { id: string; label: string; icon?: string }[];
		activeTab: string;
		class?: string;
	}>();

	function selectTab(id: string) {
		activeTab = id;
	}
</script>

<div class="flex flex-col {className}">
	<div
		class="flex overflow-x-auto no-scrollbar border-3 border-on-background rounded-lg bg-surface w-fit shadow-[4px_4px_0_0_#000]"
	>
		{#each tabs as tab, i (tab.id)}
			<button
				type="button"
				class="flex items-center justify-center gap-xs px-md py-xs font-label-sm text-xs transition-colors whitespace-nowrap outline-none flex-1 min-w-[90px]
                    {i !== 0 ? 'border-l-3 border-on-background' : ''}
					{activeTab === tab.id
					? 'bg-primary text-on-primary font-bold'
					: 'bg-transparent text-on-surface hover:bg-secondary hover:text-on-secondary'}"
				onclick={() => selectTab(tab.id)}
			>
				{#if tab.icon}
					<Icon name={tab.icon} class="text-lg" fill={activeTab === tab.id ? 1 : 0} />
				{/if}
				{tab.label}
			</button>
		{/each}
	</div>
</div>
