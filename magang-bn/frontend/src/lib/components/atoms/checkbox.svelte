<script lang="ts">
	let {
		checked = $bindable(false),
		onchange,
		id = `checkbox-${Math.random().toString(36).slice(2, 9)}`,
		label = '',
		class: className = ''
	} = $props<{
		checked?: boolean;
		onchange?: (e: Event) => void;
		id?: string;
		label?: string;
		class?: string;
	}>();
</script>

<label for={id} class="inline-flex items-center gap-2 cursor-pointer {className}">
	<div class="relative flex items-center justify-center">
		<input 
			type="checkbox" 
			{id}
			bind:checked
			onchange={onchange}
			class="peer appearance-none w-6 h-6 border-4 border-on-background bg-surface checked:bg-primary transition-colors cursor-pointer hover:shadow-neo-sm shadow-[2px_2px_0px_#0f172a] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
		/>
		<span class="material-symbols-outlined absolute text-on-background pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity font-black text-lg" style="font-variation-settings: 'wght' 700;">
			check
		</span>
	</div>
	{#if label}
		<span class="font-headline font-bold text-sm uppercase tracking-wide text-on-background">{label}</span>
	{/if}
</label>
