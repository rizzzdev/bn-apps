<script lang="ts">
	let {
		src,
		alt = 'Avatar',
		size = 'h-10 w-10',
		shadow = 'shadow-neo',
		rounded = 'rounded-none',
		class: className = ''
	} = $props<{
		src: string;
		alt?: string;
		size?: string;
		shadow?: string;
		rounded?: string;
		class?: string;
	}>();
</script>

<div
	class="border-on-background bg-on-primary overflow-hidden border-3 {size} {shadow} {rounded} {className}"
>
	<img {src} {alt} class="h-full w-full object-cover" />
</div>
