<script lang="ts">
	import GradingDetail from '$lib/components/supervisor/GradingDetail.svelte';
	let { data, form }: { data: any; form: any } = $props();
</script>

<GradingDetail {data} {form} />
