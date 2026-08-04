<script lang="ts">
	import { onMount } from 'svelte';

	export interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean;
	}

	let {
		id,
		name,
		label,
		options = [],
		value = $bindable(undefined),
		multiple = false,
		placeholder,
		required = false,
		disabled = false,
		searchable,
		searchThreshold = 10,
		hint,
		class: className = '',
		onchange
	}: {
		id?: string;
		name?: string;
		label?: string;
		options?: SelectOption[];
		value?: string | string[];
		multiple?: boolean;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		searchable?: boolean;
		searchThreshold?: number;
		hint?: string;
		class?: string;
		onchange?: (val: string | string[]) => void;
	} = $props();

	let isOpen = $state(false);
	let search = $state('');
	let containerRef = $state<HTMLDivElement | null>(null);

	// Normalize initial/bound value based on mode
	let selectedValues = $derived<string[]>(
		multiple
			? Array.isArray(value)
				? value
				: value
					? [value]
					: []
			: typeof value === 'string'
				? [value]
				: []
	);

	let isSearchEnabled = $derived(
		searchable !== undefined ? searchable : options.length >= searchThreshold
	);

	let filteredOptions = $derived(
		options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase().trim()))
	);

	let selectedOptions = $derived(
		options.filter((opt) => selectedValues.includes(opt.value))
	);

	let displayPlaceholder = $derived(
		placeholder ?? (multiple ? '-- Pilih Beberapa --' : '-- Pilih --')
	);

	function toggleOpen() {
		if (disabled) return;
		isOpen = !isOpen;
		if (isOpen) search = '';
	}

	function close() {
		isOpen = false;
		search = '';
	}

	function selectSingle(val: string) {
		value = val;
		if (onchange) onchange(val);
		close();
	}

	function toggleMultiple(val: string) {
		let current = Array.isArray(value) ? [...value] : [];
		if (current.includes(val)) {
			current = current.filter((v) => v !== val);
		} else {
			current.push(val);
		}
		value = current;
		if (onchange) onchange(current);
	}

	function removeValue(val: string, e?: Event) {
		e?.stopPropagation();
		if (!multiple) {
			value = '';
			if (onchange) onchange('');
		} else {
			let current = Array.isArray(value) ? [...value] : [];
			current = current.filter((v) => v !== val);
			value = current;
			if (onchange) onchange(current);
		}
	}

	function clearAll(e?: Event) {
		e?.stopPropagation();
		value = multiple ? [] : '';
		if (onchange) onchange(multiple ? [] : '');
	}

	let listboxId = $derived(id ? `${id}-listbox` : name ? `${name}-listbox` : 'select-listbox');

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}

	onMount(() => {
		function handleClickOutside(e: MouseEvent) {
			if (containerRef && !containerRef.contains(e.target as Node)) {
				close();
			}
		}
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="relative flex flex-col gap-1 {className}" bind:this={containerRef}>
	{#if label}
		<label for={id} class="block text-sm font-bold text-(--text-primary)">
			{label}{required ? ' *' : ''}
		</label>
	{/if}

	<!-- Hidden inputs for traditional HTML form submission -->
	{#if name}
		{#if multiple}
			{#each selectedValues as v}
				<input type="hidden" {name} value={v} />
			{/each}
		{:else}
			<input type="hidden" {name} value={selectedValues[0] ?? ''} />
		{/if}
	{/if}

	<!-- Custom Trigger Box -->
	<div
		{id}
		tabindex="0"
		role="combobox"
		aria-controls={listboxId}
		aria-expanded={isOpen}
		class="input-field flex items-center justify-between min-h-10 text-left cursor-pointer select-none gap-2 py-1.5 px-3 transition-colors duration-100"
		class:opacity-50={disabled}
		class:cursor-not-allowed={disabled}
		onclick={toggleOpen}
		onkeydown={handleKeyDown}
		onkeyup={(e) => e.key === 'Enter' && toggleOpen()}
	>
		<div class="flex flex-wrap gap-1.5 items-center flex-1 min-w-0">
			{#if selectedOptions.length === 0}
				<span class="text-sm font-medium text-(--text-secondary) truncate">
					{displayPlaceholder}
				</span>
			{:else if !multiple}
				<span class="text-sm font-bold text-(--text-primary) truncate">
					{selectedOptions[0]?.label}
				</span>
			{:else}
				{#each selectedOptions as opt (opt.value)}
					<span
						class="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border border-(--nb-border) bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200"
					>
						<span>{opt.label}</span>
						{#if !disabled}
							<button
								type="button"
								class="hover:text-red-600 focus:outline-none ml-0.5"
								onclick={(e) => removeValue(opt.value, e)}
							>
								✕
							</button>
						{/if}
					</span>
				{/each}
			{/if}
		</div>

		<div class="flex items-center gap-1 text-(--text-secondary) shrink-0">
			{#if selectedOptions.length > 0 && !disabled}
				<button
					type="button"
					class="p-0.5 text-xs hover:text-red-600 transition-colors"
					title="Clear selection"
					onclick={clearAll}
				>
					✕
				</button>
			{/if}
			<svg
				class="w-4 h-4 transition-transform duration-150"
				class:rotate-180={isOpen}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</div>

	<!-- Dropdown Panel -->
	{#if isOpen}
		<div
			class="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border-2 border-(--nb-border) bg-(--bg-primary) shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
		>
			{#if isSearchEnabled}
				<div class="p-2 border-b-2 border-(--nb-border) bg-(--bg-secondary)">
					<input
						type="text"
						class="input-field text-xs py-1.5 px-2.5 w-full"
						placeholder="Cari..."
						bind:value={search}
						onclick={(e) => e.stopPropagation()}
					/>
				</div>
			{/if}

			<ul id={listboxId} role="listbox" class="max-h-56 overflow-y-auto divide-y divide-(--nb-border)">
				{#each filteredOptions as opt (opt.value)}
					{@const isSelected = selectedValues.includes(opt.value)}
					<li>
						<button
							type="button"
							class="w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors duration-75 hover:bg-(--bg-secondary) disabled:opacity-50 disabled:cursor-not-allowed"
							class:bg-primary-50={isSelected}
							class:dark:bg-primary-950={isSelected}
							disabled={opt.disabled}
							onclick={() => (multiple ? toggleMultiple(opt.value) : selectSingle(opt.value))}
						>
							<span class="font-medium text-(--text-primary) truncate">{opt.label}</span>
							{#if isSelected}
								<span class="text-primary-600 font-bold text-xs">✓</span>
							{/if}
						</button>
					</li>
				{:else}
					<li class="p-3 text-xs text-center font-medium text-(--text-secondary)">
						{search ? 'Tidak ditemukan.' : 'Tidak ada pilihan.'}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if hint}
		<p class="text-xs text-(--text-secondary)">{hint}</p>
	{/if}
</div>
