<script lang="ts">
	let {
		value = $bindable(''),
		placeholder = '',
		type = 'text',
		class: className = '',
		...rest
	} = $props<{
		value?: string;
		placeholder?: string;
		type?: string;
		class?: string;
		[key: string]: unknown;
	}>();
</script>

<input
	{type}
	bind:value
	{placeholder}
	class="w-full bg-surface-container-lowest neo-border px-4 py-3 font-data-mono text-data-mono text-on-background placeholder:text-outline-variant focus:outline-none focus:shadow-[4px_4px_0px_0px_#1C1B1B] transition-shadow {className}"
	{...rest}
/>
