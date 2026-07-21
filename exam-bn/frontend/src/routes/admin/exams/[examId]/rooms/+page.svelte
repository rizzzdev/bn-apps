<script lang="ts">
	import ExamDetail from '$lib/components/admin/ExamDetail.svelte';

	let { data, form }: { data: any; form: any } = $props();
</script>

<ExamDetail {data} {form} />
