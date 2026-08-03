<script lang="ts">
	import { resolve } from '$app/paths';
	let { class: className = '' } = $props<{ class?: string }>();
</script>

<a
	href={resolve('/')}
	class="font-display-lg text-on-surface text-xl md:text-2xl font-black tracking-tighter whitespace-nowrap uppercase {className}"
>
	MASTER-BN
</a>
