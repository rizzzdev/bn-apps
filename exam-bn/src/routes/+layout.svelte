<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate, invalidateAll } from '$app/navigation';
	import '../app.css';
	import Toast from '$lib/components/toast.svelte';
	import Forbidden from '$lib/components/Forbidden.svelte';
	import { connectSocket, disconnectSocket } from '$lib/stores/socket';

	let { children, data } = $props();

	let accessDenied = $derived(data.accessDenied ?? false);

	afterNavigate((nav) => {
		if (nav.type === 'popstate' || (nav.from && nav.to && nav.from.url.pathname !== nav.to.url.pathname)) {
			invalidateAll();
		}
	});

	onMount(() => {
		if (!data.token) return;
		connectSocket(data.token);
		return () => disconnectSocket();
	});
</script>


{#if accessDenied}
	<Forbidden />
{:else}
	{@render children()}
{/if}
<Toast />

