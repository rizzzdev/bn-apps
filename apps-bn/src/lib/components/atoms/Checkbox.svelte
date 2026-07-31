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

<label class="flex items-center gap-3 cursor-pointer group {className}">
	<!-- Kotak kustom untuk neobrutalism -->
	<div 
		class="relative w-6 h-6 rounded neo-border transition-all duration-200 flex-shrink-0 
			{checked ? 'bg-primary-container shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-[1px] -translate-x-[1px]' : 'bg-surface shadow-none group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:-translate-y-[1px] group-hover:-translate-x-[1px]'}"
	>
		{#if checked}
			<svg class="absolute inset-0 w-full h-full text-white pointer-events-none p-[2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
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
		<span class="font-label-bold text-sm transition-colors duration-200 {checked ? 'text-primary' : 'text-on-surface'}">
			{label}
		</span>
	{/if}
</label>
