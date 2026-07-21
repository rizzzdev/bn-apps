<script lang="ts">
	import QuestionsDetail from '$lib/components/supervisor/QuestionsDetail.svelte';
	let { data, form }: { data: any; form: any } = $props();
</script>

<QuestionsDetail {data} {form} />
