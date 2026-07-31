<script lang="ts">
	let {
		icon,
		label,
		variant = 'secondary',
		disabled = false,
		className = '',
		onclick
	}: {
		icon: string;
		label: string;
		variant?: 'primary' | 'secondary' | 'danger' | 'tertiary';
		disabled?: boolean;
		className?: string;
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const variantStyles = {
		primary: 'bg-primary-container text-white hover:bg-primary-fixed-dim',
		secondary: 'bg-secondary-fixed text-black hover:bg-secondary-fixed-dim',
		danger: 'bg-error text-white hover:bg-[#93000a]',
		tertiary: 'bg-tertiary-container text-on-tertiary hover:bg-tertiary-fixed-dim'
	};
</script>

<div class="relative inline-block group">
	<button
		type="button"
		{disabled}
		class="w-9 h-9 md:w-10 md:h-10 rounded-lg border-2 md:border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed {variantStyles[variant]} {className}"
		{onclick}
		aria-label={label}
	>
		<span class="material-symbols-outlined text-lg md:text-xl select-none">{icon}</span>
	</button>

	<!-- Tooltip mengarah ke kiri (right-full) -->
	<div
		class="absolute right-full top-1/2 -translate-y-1/2 mr-2 hidden group-hover:flex items-center z-50 pointer-events-none whitespace-nowrap transition-opacity duration-150"
	>
		<div
			class="bg-black text-white text-[11px] md:text-xs font-label-bold px-2.5 py-1 rounded-md shadow-lg border border-gray-700 uppercase tracking-wider"
		>
			{label}
		</div>
		<div class="w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-black -ml-[1px]"></div>
	</div>
</div>
