<script lang="ts">
	let {
		label,
		value,
		class: className = ''
	} = $props<{
		label: string;
		value: string;
		class?: string;
	}>();
</script>

<div class="flex justify-between items-center gap-4 py-2 {className}">
	<span class="font-data-mono text-data-mono text-on-surface-variant">{label}</span>
	<span class="font-data-mono text-data-mono font-bold text-on-background text-right">{value}</span>
</div>
