<script lang="ts">
	import ExamRoomDetail from '$lib/components/admin/ExamRoomDetail.svelte';

	let { data, form }: { data: any; form: any } = $props();
</script>

<ExamRoomDetail {data} {form} />
