<script lang="ts">
	let {
		checked = false,
		label = '',
		className = '',
		onchange
	} = $props<{
		checked?: boolean;
		label?: string;
		className?: string;
		onchange?: (e: Event) => void;
	}>();
</script>

<label class="group flex cursor-pointer items-center gap-3 {className}">
	<!-- Kotak kustom untuk neobrutalism -->
	<div
		class="neo-border relative h-6 w-6 flex-shrink-0 rounded transition-all duration-200
			{checked
			? '-translate-x-[1px] -translate-y-[1px] bg-primary-container shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
			: 'bg-surface shadow-none group-hover:-translate-x-[1px] group-hover:-translate-y-[1px] group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}"
	>
		{#if checked}
			<svg
				class="pointer-events-none absolute inset-0 h-full w-full p-[2px] text-white"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="3.5"
					d="M5 13l4 4L19 7"
				/>
			</svg>
		{/if}
	</div>

	<!-- Input asli yang disembunyikan (untuk fungsionalitas murni) -->
	<input
		type="checkbox"
		class="sr-only"
		{checked}
		onchange={(e) => {
			if (onchange) onchange(e);
		}}
	/>

	{#if label}
		<span
			class="font-label-bold text-sm transition-colors duration-200 {checked
				? 'text-primary'
				: 'text-on-surface'}"
		>
			{label}
		</span>
	{/if}
</label>
