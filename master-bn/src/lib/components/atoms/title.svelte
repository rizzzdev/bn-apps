<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	let { class: className = '' } = $props<{ class?: string }>();

	let isAuthRoute = $derived($page.url.pathname.startsWith('/403'));
</script>

{#if isAuthRoute}
	<span
		class="font-display-lg text-on-surface text-xl md:text-2xl font-black tracking-tighter whitespace-nowrap uppercase cursor-default {className}"
	>
		MASTER-BN
	</span>
{:else}
	<a
		href={resolve('/')}
		class="font-display-lg text-on-surface text-xl md:text-2xl font-black tracking-tighter whitespace-nowrap uppercase {className}"
	>
		MASTER-BN
	</a>
{/if}
