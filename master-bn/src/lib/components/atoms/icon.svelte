<script lang="ts">
	let {
		name,
		class: className = '',
		fill = 0
	} = $props<{ name: string; class?: string; fill?: number | string }>();
</script>

<span class="material-symbols-outlined {className}" style="font-variation-settings: 'FILL' {fill}">
	{name}
</span>
