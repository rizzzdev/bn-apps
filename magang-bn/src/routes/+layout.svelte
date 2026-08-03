<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toast } from '$lib/components/molecules';
	import { Forbidden } from '$lib/components/templates';
	import { toastState } from '$lib/stores/toast.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	let user = $derived($page.data.user);
	let accessDenied = $derived($page.data.accessDenied);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if accessDenied}
	<Forbidden />
{:else}
	{@render children()}
{/if}

<Toast bind:show={toastState.show} type={toastState.type} message={toastState.message} />
