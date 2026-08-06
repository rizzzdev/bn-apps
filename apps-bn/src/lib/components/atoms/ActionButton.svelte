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

<div class="group relative inline-block">
	<button
		type="button"
		{disabled}
		class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:w-10 md:border-3 {variantStyles[
			variant
		]} {className}"
		{onclick}
		aria-label={label}
	>
		<span class="material-symbols-outlined text-lg select-none md:text-xl">{icon}</span>
	</button>

	<!-- Tooltip mengarah ke kiri (right-full) -->
	<div
		class="pointer-events-none absolute top-1/2 right-full z-50 mr-2 hidden -translate-y-1/2 items-center whitespace-nowrap transition-opacity duration-150 group-hover:flex"
	>
		<div
			class="rounded-md border border-gray-700 bg-black px-2.5 py-1 font-label-bold text-[11px] tracking-wider text-white uppercase shadow-lg md:text-xs"
		>
			{label}
		</div>
		<div class="-ml-[1px] h-0 w-0 border-y-4 border-l-4 border-y-transparent border-l-black"></div>
	</div>
</div>
