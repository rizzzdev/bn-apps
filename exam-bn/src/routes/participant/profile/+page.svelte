<script lang="ts">
	import ProfilePage from '$lib/components/ProfilePage.svelte';
	let { data }: { data: any } = $props();
</script>

<ProfilePage {data} />
