<script lang="ts">
	import { page } from '$app/stores';
	let { class: className = '' } = $props<{ class?: string }>();
	
	let isAuthRoute = $derived(
		$page.url.pathname.startsWith('/login') || 
		$page.url.pathname.startsWith('/403')
	);
</script>

{#if isAuthRoute}
	<span class="font-display-lg text-on-surface text-3xl font-bold tracking-tighter whitespace-nowrap uppercase cursor-default {className}">
		MASTER-BN
	</span>
{:else}
	<a href="/" class="font-display-lg text-on-surface text-3xl font-bold tracking-tighter whitespace-nowrap uppercase {className}">
		MASTER-BN
	</a>
{/if}
