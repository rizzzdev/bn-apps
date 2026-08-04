<script lang="ts">
	import AnswerMonitor from '$lib/components/AnswerMonitor.svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleBack() {
		goto(`/supervisor/rooms/${data.examRoomId}`);
	}
</script>

<svelte:head>
	<title>Monitor Jawaban - Exam-BN</title>
</svelte:head>

<AnswerMonitor
	participantId={data.participantId}
	examRoomId={data.examRoomId}
	token={data.token}
	questions={data.questions}
	initialAnswers={data.initialAnswers}
	onBack={handleBack}
/>
