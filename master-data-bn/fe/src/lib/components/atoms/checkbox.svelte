<script lang="ts">
	let {
		class: className = '',
		group = $bindable(),
		value = undefined,
		checked = $bindable(false),
		...rest
	} = $props<{
		class?: string;
		group?: unknown[];
		value?: unknown;
		checked?: boolean;
		[key: string]: unknown;
	}>();

	const baseClasses = "appearance-none flex-shrink-0 w-5 h-5 bg-surface border-3 border-on-background rounded-[4px] shadow-neo-xs cursor-pointer checked:bg-secondary checked:after:content-[''] checked:relative checked:after:absolute checked:after:left-[4px] checked:after:top-[1px] checked:after:w-[5px] checked:after:h-[9px] checked:after:border-r-[2.5px] checked:after:border-b-[2.5px] checked:after:border-on-secondary checked:after:rotate-45 focus:outline-none hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all";

	let isChecked = $derived(group !== undefined && value !== undefined ? group.includes(value) : checked);

	function handleChange(e: Event) {
		const targetChecked = (e.target as HTMLInputElement).checked;
		if (group !== undefined && value !== undefined) {
			if (targetChecked) {
				group = [...group, value];
			} else {
				group = group.filter((v: unknown) => v !== value);
			}
		} else {
			checked = targetChecked;
		}
		if (typeof rest.onchange === 'function') {
			rest.onchange(e);
		}
	}
</script>

<input 
	type="checkbox" 
	checked={isChecked}
	onchange={handleChange}
	{value}
	class="{baseClasses} {className}"
	{...rest}
/>
