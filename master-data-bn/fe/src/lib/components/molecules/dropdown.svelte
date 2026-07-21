<script lang="ts">
	import { Icon } from '$lib/components/atoms';

	let {
		value = $bindable(),
		options = [],
		placeholder = 'Pilih...',
		searchable,
		multiple = false,
		variant = 'default',
		class: className = '',
		...rest
	} = $props<{
		value?: unknown | unknown[];
		options: { value: unknown; label: string }[];
		placeholder?: string;
		searchable?: boolean;
		multiple?: boolean;
		variant?: 'default' | 'input';
		class?: string;
		[key: string]: unknown;
	}>();

	let actualSearchable = $derived(searchable !== undefined ? searchable : options.length > 5);

	let isOpen = $state(false);
	let searchQuery = $state('');
	let dropdownRef: HTMLDivElement;

	let filteredOptions = $derived(
		options.filter((opt: { value: unknown, label: string }) =>
			opt.label.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function toggleDropdown() {
		isOpen = !isOpen;
		if (isOpen) searchQuery = '';
	}

	function handleSelect(optionValue: unknown) {
		if (multiple) {
			if (!Array.isArray(value)) value = [];
			if (value.includes(optionValue)) {
				value = value.filter((v: unknown) => v !== optionValue);
			} else {
				value = [...value, optionValue];
			}
		} else {
			value = optionValue;
			isOpen = false;
		}
	}

	function removeValue(optionValue: unknown, event: Event) {
		event.stopPropagation();
		if (Array.isArray(value)) {
			value = value.filter((v: unknown) => v !== optionValue);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (isOpen && dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	let displayLabel = $derived.by(() => {
		if (multiple) {
			if (!Array.isArray(value) || value.length === 0) return placeholder;
			return `${value.length} terpilih`;
		} else {
			const selected = options.find((opt: { value: unknown, label: string }) => opt.value === value);
			return selected ? selected.label : placeholder;
		}
	});

	let selectedObjects = $derived.by(() => {
		if (multiple && Array.isArray(value)) {
			return options.filter((opt: { value: unknown, label: string }) => value.includes(opt.value));
		}
		return [];
	});
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative inline-block {className}" bind:this={dropdownRef}>
	<button
		type="button"
		class="w-full flex items-center justify-between border-3 border-on-background {variant === 'input' ? 'bg-surface px-sm py-2.5 font-body-base text-body-base' : 'bg-surface-container-lowest px-sm font-label-sm text-label-sm h-10'} text-on-surface outline-none rounded-lg transition-colors hover:bg-surface-container-highest cursor-pointer"
		onclick={toggleDropdown}
		{...rest}
	>
		<div class="flex items-center gap-xs overflow-hidden whitespace-nowrap">
			{#if multiple && Array.isArray(value) && value.length > 0}
				{#if selectedObjects.length <= 2}
					{#each selectedObjects as obj}
						<span class="bg-secondary text-on-secondary px-2 py-0.5 rounded text-2xs uppercase flex items-center gap-1 border border-on-background">
							{obj.label}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								class="hover:text-error cursor-pointer flex items-center"
								role="button"
								tabindex="0"
								onclick={(e) => removeValue(obj.value, e)}
							>
								<Icon name="close" class="text-xs" fill={0} />
							</div>
						</span>
					{/each}
				{:else}
					<span class="uppercase truncate font-bold">{displayLabel}</span>
				{/if}
			{:else}
				<span class="{variant === 'input' ? '' : 'uppercase'} truncate {value ? 'text-on-surface' : 'text-on-surface-variant'}">
					{displayLabel}
				</span>
			{/if}
		</div>
		<Icon name={isOpen ? 'arrow_drop_up' : 'arrow_drop_down'} class="text-on-surface flex-shrink-0" fill={1} />
	</button>

	{#if isOpen}
		<div class="absolute z-50 mt-2 w-full min-w-[200px] right-0 md:left-0 border-3 border-on-background bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col max-h-64">
			{#if actualSearchable}
				<div class="p-xs border-b-3 border-on-background bg-surface-container sticky top-0 z-10 flex items-center gap-xs">
					<Icon name="search" class="text-base text-on-surface-variant" fill={0} />
					<!-- svelte-ignore a11y_autofocus -->
					<input
						type="text"
						autofocus
						bind:value={searchQuery}
						placeholder="Cari opsi..."
						class="w-full bg-transparent font-label-sm text-label-sm outline-none text-on-surface uppercase"
						onclick={(e) => e.stopPropagation()}
					/>
				</div>
			{/if}
			<div class="overflow-y-auto">
				{#each filteredOptions as option}
					{@const isSelected = multiple ? Array.isArray(value) && value.includes(option.value) : value === option.value}
					<button
						type="button"
						class="w-full text-left px-sm py-2 {variant === 'input' ? 'font-body-base text-body-base' : 'font-label-sm text-label-sm uppercase'} hover:bg-surface-container-highest transition-colors flex items-center justify-between border-b border-on-background/20 last:border-b-0 {isSelected ? 'bg-surface-variant font-bold' : ''}"
						onclick={() => handleSelect(option.value)}
					>
						<span>{option.label}</span>
						{#if isSelected}
							<Icon name="check" class="text-base text-on-surface" fill={0} />
						{/if}
					</button>
				{:else}
					<div class="px-sm py-md text-center font-label-sm text-label-sm text-on-surface-variant uppercase">
						Tidak ada hasil
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
