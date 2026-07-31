<script lang="ts">
	import { Label, Icon } from '$lib/components/atoms';

	let {
		id,
		label,
		value = $bindable(),
		options = [] as { value: string; label: string }[],
		placeholder = 'Pilih...',
		searchThreshold = 10,
		multiple = false,
		class: className = ''
	} = $props<{
		id: string;
		label?: string;
		value?: string | string[] | null;
		options?: { value: string; label: string }[];
		placeholder?: string;
		searchThreshold?: number;
		multiple?: boolean;
		class?: string;
	}>();

	$effect(() => {
		if (multiple && value === undefined) {
			value = [];
		}
	});

	let isOpen = $state(false);
	let searchQuery = $state('');
	let containerRef: HTMLDivElement;

	let filteredOptions = $derived(
		options.filter((o: { value: string; label: string }) =>
			o.label.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	let showSearch = $derived(options.length >= searchThreshold);

	let displayValue = $derived(() => {
		if (multiple) {
			const arr = Array.isArray(value) ? value : [];
			if (arr.length === 0) return placeholder;
			return `${arr.length} terpilih`;
		} else {
			const selected = options.find((o: { value: string; label: string }) => o.value === value);
			return selected ? selected.label : placeholder;
		}
	});

	function toggleOpen() {
		isOpen = !isOpen;
		if (isOpen) {
			searchQuery = '';
		}
	}

	function handleSelect(optionValue: string) {
		if (multiple) {
			const arr = Array.isArray(value) ? [...value] : [];
			if (arr.includes(optionValue)) {
				value = arr.filter((v) => v !== optionValue);
			} else {
				value = [...arr, optionValue];
			}
		} else {
			value = optionValue;
			isOpen = false;
		}
	}

	function handleWindowClick(e: MouseEvent) {
		if (isOpen && containerRef && !containerRef.contains(e.target as Node)) {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div class="flex flex-col gap-2 relative {className}" bind:this={containerRef}>
	{#if label}
		<Label for={id}>{label}</Label>
	{/if}
	<button
		type="button"
		{id}
		onclick={toggleOpen}
		class="w-full h-8 bg-surface-container-lowest neo-border px-4 font-data-mono text-xs text-on-background focus:outline-none focus:shadow-[4px_4px_0px_0px_#1C1B1B] transition-shadow text-left flex justify-between items-center"
	>
		<span
			class="truncate pr-4 {!value || (multiple && Array.isArray(value) && value.length === 0)
				? 'opacity-50'
				: ''}"
		>
			{displayValue()}
		</span>
		<Icon name={isOpen ? 'expand_less' : 'expand_more'} size="20px" class="flex-shrink-0" />
	</button>

	{#if isOpen}
		<div
			class="absolute top-[100%] mt-2 left-0 right-0 z-50 bg-surface-container-lowest neo-border neo-shadow flex flex-col"
		>
			{#if showSearch}
				<div class="p-2 bg-surface-container-lowest neo-border-b z-10 shrink-0">
					<div class="flex items-center neo-border px-3 py-2 bg-surface">
						<Icon name="search" size="18px" class="text-on-surface-variant mr-2" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Cari..."
							class="w-full bg-transparent border-none outline-none font-data-mono text-xs"
							onclick={(e) => e.stopPropagation()}
						/>
					</div>
				</div>
			{/if}

			{#if multiple}
				<div class="flex border-b-2 border-on-surface bg-surface z-10 shrink-0">
					<button
						type="button"
						class="flex-1 py-1 font-data-mono text-xs font-bold text-center border-r-2 border-on-surface bg-surface text-primary hover:bg-primary hover:text-on-primary transition-colors"
						onclick={(e) => {
							e.stopPropagation();
							value = options.map((o: any) => o.value);
						}}
					>
						PILIH SEMUA
					</button>
					<button
						type="button"
						class="flex-1 py-1 font-data-mono text-xs font-bold text-center bg-surface text-error hover:bg-error hover:text-on-error transition-colors"
						onclick={(e) => {
							e.stopPropagation();
							value = [];
						}}
					>
						BATALKAN
					</button>
				</div>
				{#if Array.isArray(value) && value.length > 0}
					<div
						class="p-2 bg-surface-container-highest max-h-32 overflow-y-auto flex flex-wrap gap-1 neo-border-b shrink-0"
					>
						{#each value as v}
							{@const opt = options.find((o: any) => o.value === v)}
							{#if opt}
								<span
									class="bg-secondary text-on-secondary text-[10px] px-1 py-0.5 neo-border-xs whitespace-nowrap"
									>{opt.label}</span
								>
							{/if}
						{/each}
					</div>
				{/if}
			{/if}

			<div class="p-1 flex flex-col max-h-64 overflow-y-auto gap-0.5">
				{#each filteredOptions as opt}
					{@const isSelected = multiple
						? Array.isArray(value) && value.includes(opt.value)
						: value === opt.value}
					<button
						type="button"
						class="text-left px-2 py-1 hover:bg-primary hover:text-on-primary transition-colors font-data-mono text-sm flex items-center justify-between {isSelected
							? 'bg-primary-container text-on-primary-container font-bold'
							: ''}"
						onclick={(e) => {
							e.stopPropagation();
							handleSelect(opt.value);
						}}
					>
						<span>{opt.label}</span>
						{#if isSelected}
							<Icon name="check" size="16px" />
						{/if}
					</button>
				{/each}

				{#if filteredOptions.length === 0}
					<div class="p-4 text-center text-sm font-data-mono text-on-surface-variant opacity-70">
						Tidak ada hasil
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
