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
	<div class="border-b-3 border-on-background flex overflow-x-auto no-scrollbar bg-surface-container-low rounded-t-lg border-x-[3px] border-t-3">
		{#each tabs as tab, i}
			<button
				type="button"
				class="flex items-center gap-xs px-md py-sm font-label-lg transition-colors border-r-3 border-on-background whitespace-nowrap outline-none
					{activeTab === tab.id 
						? 'bg-primary text-on-primary font-bold shadow-[inset_0px_-6px_0px_0px_rgba(0,0,0,1)]' 
						: 'bg-surface text-on-surface hover:bg-secondary hover:text-on-secondary'}
                    {i === tabs.length - 1 ? 'border-r-0' : ''}"
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
