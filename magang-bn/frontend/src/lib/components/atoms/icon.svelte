<script lang="ts">
	let {
		name,
		class: className = '',
		filled = false
	} = $props<{ name: string; class?: string; filled?: boolean }>();
</script>

<span
	class="material-symbols-outlined {className}"
	style="font-variation-settings: 'FILL' {filled ? 1 : 0};"
>
	{name}
</span>
