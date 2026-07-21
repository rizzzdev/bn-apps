<script lang="ts">
	import ProfilePage from '$lib/components/ProfilePage.svelte';
	let { data, form }: { data: any; form: any } = $props();
</script>

<ProfilePage {data} {form} />
