<script lang="ts">
	import ExamMonitor from '$lib/components/monitoring/ExamMonitor.svelte';

	let { data }: { data: any } = $props();
</script>

<ExamMonitor {data} role="SUPERVISOR" />
