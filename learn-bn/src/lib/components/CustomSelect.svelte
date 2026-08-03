<script lang="ts">
	import { onMount } from 'svelte';

	export interface SelectOption {
		value: string;
		label: string;
		description?: string;
	}

	let {
		options = [],
		value = $bindable(),
		multiple = false,
		placeholder = 'Pilih...',
		label = '',
		required = false,
		disabled = false,
		error = '',
		class: customClass = ''
	}: {
		options: SelectOption[];
		value: any;
		multiple?: boolean;
		placeholder?: string;
		label?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		class?: string;
	} = $props();

	let isOpen = $state(false);
	let searchQuery = $state('');
	let containerRef = $state<HTMLDivElement | null>(null);

	let showSearch = $derived(options.length > 10);

	let filteredOptions = $derived(
		searchQuery.trim() === ''
			? options
			: options.filter(
					(opt) =>
						opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
						opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
				)
	);

	let selectedValues = $derived<string[]>(
		multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : [])
	);

	let selectedOptions = $derived(
		options.filter((opt) => selectedValues.includes(opt.value))
	);

	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) {
			searchQuery = '';
		}
	}

	function selectOption(optValue: string) {
		if (disabled) return;
		if (multiple) {
			const current = Array.isArray(value) ? [...value] : [];
			if (current.includes(optValue)) {
				value = current.filter((v) => v !== optValue);
			} else {
				value = [...current, optValue];
			}
		} else {
			value = optValue;
			isOpen = false;
		}
	}

	function removeOption(e: MouseEvent, optValue: string) {
		e.stopPropagation();
		if (disabled) return;
		if (multiple && Array.isArray(value)) {
			value = value.filter((v) => v !== optValue);
		}
	}

	function handleSelectAll() {
		if (disabled || !multiple) return;
		if (selectedValues.length === options.length) {
			value = [];
		} else {
			value = options.map((opt) => opt.value);
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (containerRef && !containerRef.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class={`flex flex-col gap-1 w-full relative ${customClass}`} bind:this={containerRef}>
	{#if label}
		<div class="flex justify-between items-center">
			<span class="font-label-bold text-sm text-on-surface flex items-center gap-1">
				{label}
				{#if required}<span class="text-error">*</span>{/if}
			</span>
			{#if multiple && isOpen}
				<button
					type="button"
					onclick={handleSelectAll}
					class="text-xs font-label-bold text-primary hover:underline cursor-pointer"
				>
					{selectedValues.length === options.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
				</button>
			{/if}
		</div>
	{/if}

	<!-- Dropdown Trigger Button -->
	<button
		type="button"
		onclick={toggleDropdown}
		{disabled}
		class={`w-full min-h-[48px] py-1.5 px-3 bg-surface-container-lowest neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
			isOpen ? 'ring-2 ring-primary shadow-none translate-x-[1px] translate-y-[1px]' : ''
		} ${disabled ? 'opacity-60 cursor-not-allowed bg-surface-container' : ''}`}
	>
		<div class="flex flex-wrap items-center gap-1.5 min-w-0 flex-1 my-auto">
			{#if selectedOptions.length === 0}
				<span class="font-body-md text-secondary text-sm truncate">{placeholder}</span>
			{:else if multiple}
				{#each selectedOptions as opt}
					<span
						class="bg-primary-container text-on-surface neo-border text-xs font-label-bold px-2 py-0.5 inline-flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
					>
						<span>{opt.label}</span>
						<span
							role="button"
							tabindex="0"
							onclick={(e) => removeOption(e, opt.value)}
							onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && removeOption(e as any, opt.value)}
							class="hover:text-error cursor-pointer flex items-center justify-center shrink-0"
						>
							<span class="material-symbols-outlined text-xs">close</span>
						</span>
					</span>
				{/each}
			{:else}
				<span class="font-label-bold text-sm text-on-surface truncate">
					{selectedOptions[0]?.label}
				</span>
			{/if}
		</div>

		<span class="material-symbols-outlined text-secondary shrink-0 transition-transform duration-200" style={isOpen ? 'transform: rotate(180deg);' : ''}>
			expand_more
		</span>
	</button>

	<!-- Dropdown Options Panel -->
	{#if isOpen}
		<div
			class="absolute left-0 right-0 top-full mt-1 bg-surface-container-lowest neo-border shadow-[6px_6px_0px_0px_rgba(26,28,28,1)] z-50 overflow-hidden flex flex-col"
		>
			<!-- Search Input if options > 10 -->
			{#if showSearch}
				<div class="p-2 border-b-2 border-on-surface bg-surface-container/40">
					<div class="relative flex items-center">
						<span class="material-symbols-outlined text-sm text-secondary absolute left-2.5">search</span>
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Cari opsi..."
							class="w-full pl-8 pr-3 py-1.5 bg-surface-container-lowest neo-border text-xs font-label-bold outline-none focus:ring-1 focus:ring-primary"
							onclick={(e) => e.stopPropagation()}
						/>
					</div>
				</div>
			{/if}

			<!-- Options List Panel with Max Height & Overflow Y Auto -->
			<div class="max-h-60 overflow-y-auto p-1 divide-y divide-on-surface/10">
				{#if filteredOptions.length === 0}
					<div class="p-4 text-center text-xs font-label-bold text-secondary italic">
						Opsi tidak ditemukan
					</div>
				{:else}
					{#each filteredOptions as opt}
						{@const isSelected = selectedValues.includes(opt.value)}
						<button
							type="button"
							onclick={() => selectOption(opt.value)}
							class={`w-full p-2.5 text-left text-xs font-label-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
								isSelected
									? 'bg-primary-container/60 text-on-surface font-black'
									: 'hover:bg-surface-container text-on-surface'
							}`}
						>
							<div class="min-w-0 flex-1">
								<p class="truncate">{opt.label}</p>
								{#if opt.description}
									<p class="text-[10px] text-secondary font-normal truncate">{opt.description}</p>
								{/if}
							</div>

							{#if isSelected}
								<span class="material-symbols-outlined text-sm text-primary shrink-0">check</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}

	{#if error}
		<span class="text-xs text-error font-label-bold mt-0.5">{error}</span>
	{/if}
</div>
