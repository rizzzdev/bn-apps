<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ToastContainer } from '$lib/components/organisms';
	import type { Snippet } from 'svelte';

	let { children } = $props<{ children: Snippet }>();
</script>

<svelte:head>
	<title>Akademik-BN</title>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<ToastContainer />
