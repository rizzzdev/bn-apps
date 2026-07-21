<script lang="ts">
	import { Icon } from '../atoms';
	import { slide } from 'svelte/transition';
	
	export type Option = { label: string; value: string | number };
	
	let {
		id = '',
		options = [],
		value = $bindable(),
		multiple = false,
		placeholder = 'Pilih...',
		class: className = '',
		searchable = undefined,
		variant = 'default'
	} = $props<{
		id?: string;
		options: Option[];
		value?: any;
		multiple?: boolean;
		placeholder?: string;
		class?: string;
		searchable?: boolean;
		variant?: 'default' | 'small';
	}>();
	
	let isOpen = $state(false);
	let searchQuery = $state('');
	let containerRef: HTMLElement | undefined = $state();
	
	let showSearch = $derived(searchable ?? options.length > 10);
	
	let filteredOptions = $derived(
		searchQuery.trim() === '' 
			? options 
			: options.filter((opt: Option) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
	);
	
	function toggleDropdown() {
		isOpen = !isOpen;
		if (isOpen) {
			searchQuery = '';
		}
	}
	
	function selectOption(option: Option) {
		if (multiple) {
			if (!Array.isArray(value)) value = [];
			if (value.includes(option.value)) {
				value = value.filter((v: any) => v !== option.value);
			} else {
				value = [...value, option.value];
			}
		} else {
			value = option.value;
			isOpen = false;
		}
	}
	
	function removeOption(e: Event, valToRemove: string | number) {
		e.stopPropagation();
		if (Array.isArray(value)) {
			value = value.filter((v: any) => v !== valToRemove);
		}
	}
	
	let displayLabel = $derived.by(() => {
		if (multiple) {
			if (!Array.isArray(value) || value.length === 0) return null;
			return 'multiple';
		}
		if (value == null || value === '') return null;
		const found = options.find((o: Option) => o.value === value);
		return found ? found.label : null;
	});
	
	function handleClickOutside(e: MouseEvent) {
		if (isOpen && containerRef && !containerRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggleDropdown();
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div bind:this={containerRef} class="relative {className}">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div 
		role="button"
		tabindex="0"
		class="w-full bg-surface cursor-pointer flex justify-between items-center transition-all focus:outline-none focus:ring-4 focus:ring-primary/50 {variant === 'small' ? 'border-2 border-on-background p-1 px-2 text-xs' : 'border-4 border-on-background p-3'}"
		onclick={toggleDropdown}
		onkeydown={handleKeydown}
		{id}
	>
		<div class="flex flex-wrap gap-1 font-mono font-bold text-left flex-1 items-center">
			{#if displayLabel === 'multiple'}
				{#each (value as (string|number)[]) as val}
					{@const opt = options.find((o: Option) => o.value === val)}
					{#if opt}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<span class="inline-flex items-center gap-1 bg-primary text-on-background px-2 py-0.5 border-2 border-on-background text-xs" onclick={(e) => e.stopPropagation()}>
							{opt.label}
							<button type="button" class="hover:text-error ml-1" onclick={(e) => removeOption(e, opt.value)}>
								<Icon name="close" class="text-xs" />
							</button>
						</span>
					{/if}
				{/each}
			{:else if displayLabel}
				<span>{displayLabel}</span>
			{:else}
				<span class="text-secondary">{placeholder}</span>
			{/if}
		</div>
		<Icon name={isOpen ? 'expand_less' : 'expand_more'} class="ml-2 shrink-0" />
	</div>
	
	{#if isOpen}
		<div transition:slide={{duration: 200}} class="absolute z-[100] top-full left-0 right-0 mt-1 bg-surface shadow-neo max-h-60 flex flex-col {variant === 'small' ? 'border-2 border-on-background text-xs' : 'border-4 border-on-background'}">
			{#if showSearch}
				<div class="p-2 border-b-4 border-on-background bg-slate-50 sticky top-0 z-10">
					<div class="flex items-center border-2 border-on-background bg-surface px-2">
						<Icon name="search" class="text-secondary text-sm" />
						<input 
							type="text" 
							class="w-full p-2 outline-none font-mono text-sm bg-transparent" 
							placeholder="Cari..." 
							bind:value={searchQuery}
							onclick={(e) => e.stopPropagation()}
						/>
					</div>
				</div>
			{/if}
			
			<div class="overflow-y-auto overflow-x-hidden flex-1 relative z-0">
				{#if filteredOptions.length === 0}
					<div class="p-4 text-center font-mono text-sm text-secondary">
						Tidak ada hasil.
					</div>
				{:else}
					<ul class="flex flex-col">
						{#each filteredOptions as option}
							{@const isSelected = multiple ? (Array.isArray(value) && value.includes(option.value)) : value === option.value}
							<li>
								<button 
									type="button"
									class="w-full text-left border-b-2 border-transparent hover:border-b-on-background hover:bg-blue-50 font-mono transition-colors flex justify-between items-center cursor-pointer {isSelected ? 'bg-primary/10 font-bold text-primary' : ''} {variant === 'small' ? 'p-1.5 text-xs' : 'p-3 text-sm'}"
									onclick={() => selectOption(option)}
								>
									<span>{option.label}</span>
									{#if isSelected}
										<Icon name="check" class="text-primary text-sm" />
									{/if}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</div>
