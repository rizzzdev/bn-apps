<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import Toast from '$lib/components/toast.svelte';
	import { connectSocket, disconnectSocket } from '$lib/stores/socket';

	let { children, data } = $props();

	onMount(() => {
		if (!data.token) return;
		connectSocket(data.token);
		return () => disconnectSocket();
	});
</script>

{@render children()}
<Toast />
