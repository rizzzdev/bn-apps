<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { connectSocket } from '$lib/stores/socket';
	import type { Socket } from 'socket.io-client';
	import ExamOption from '$lib/components/ui/ExamOption.svelte';
	import { resolveBackendUrl } from '$lib/utils/backend-url';

	let {
		participantId,
		examRoomId,
		token,
		questions,
		initialAnswers,
		onBack
	}: {
		participantId: string;
		examRoomId: string;
		token: string;
		questions: any[];
		initialAnswers: any[];
		onBack: () => void;
	} = $props();

	const API_BASE = resolveBackendUrl() + '/api/v1';

	let socket: Socket | null = null;
	let selectedOptions = $state<Record<string, string>>({});
	let essayTexts = $state<Record<string, string>>({});
	let participantName = $state<string>('Peserta');

	let currentQuestionIndex = $state(0);
	const currentQuestion = $derived(questions[currentQuestionIndex]);
	const answeredCount = $derived(
		Object.keys(selectedOptions).length +
			Object.keys(essayTexts).filter((k) => essayTexts[k]?.trim()).length
	);

	onMount(() => {
		// Initialize answers
		for (const a of initialAnswers) {
			if (a.optionId) selectedOptions[a.questionId] = a.optionId;
			if (a.text) essayTexts[a.questionId] = a.text;
		}

		// Fetch participant detail
		fetch(`${API_BASE}/exam/users/${participantId}`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.data) participantName = data.data.fullname;
			})
			.catch(() => {});

		socket = connectSocket(token);

		socket.on('connect', () => {
			socket!.emit('exam:monitor:join', { examRoomId });
		});
		if (socket.connected) socket.emit('exam:monitor:join', { examRoomId });

		socket.on('exam:participant:answer_updated', (payload: any) => {
			if (payload.userId === participantId) {
				if (payload.optionId) {
					selectedOptions[payload.questionId] = payload.optionId;
				} else if (payload.text !== undefined) {
					essayTexts[payload.questionId] = payload.text;
				}
			}
		});
	});

	onDestroy(() => {
		if (socket) {
			socket.emit('exam:monitor:leave', { examRoomId });
		}
	});
</script>

<div class="mb-6 flex items-center justify-between">
	<div>
		<button
			onclick={onBack}
			class="text-sm font-medium text-primary-600 hover:underline mb-2 flex items-center gap-1"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/></svg
			>
			Kembali
		</button>
		<h1 class="text-2xl font-black text-(--text-primary)">Monitor Pekerjaan</h1>
		<p class="mt-1 text-sm font-medium text-(--text-secondary)">
			Memantau jawaban <strong class="text-(--text-primary)">{participantName}</strong> secara realtime
			(Read Only).
		</p>
	</div>
	<div class="card p-3 flex items-center gap-3">
		<span class="relative flex h-3 w-3">
			<span
				class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
			></span>
			<span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
		</span>
		<span class="text-sm font-bold text-(--text-primary)">Live Sync</span>
	</div>
</div>

<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
	<div class="lg:col-span-3">
		{#if currentQuestion}
			{@const q = currentQuestion.question}
			<div class="card p-6 sm:p-8 space-y-6">
				<div class="flex items-start gap-3">
					<span
						class="shrink-0 w-8 h-8 flex items-center justify-center text-sm font-black text-white bg-primary-500 border-2 border-(--nb-border)"
					>
						{currentQuestion.questionNumber}
					</span>
					<p class="text-base font-medium text-(--text-primary) leading-relaxed flex-1">
						{q?.text ?? '—'}
					</p>
				</div>

				{#if q?.type === 'MULTIPLE_CHOICE' && q.options && q.options.length > 0}
					<div class="space-y-3 pointer-events-none opacity-90">
						{#each q.options as opt, idx}
							<ExamOption
								label={String.fromCharCode(65 + idx)}
								text={opt.text}
								selected={selectedOptions[q.id] === opt.id}
								onclick={() => {}}
							/>
						{/each}
					</div>
				{:else if q?.type === 'ESSAY'}
					<textarea
						class="input-field resize-none h-40 bg-gray-50 cursor-not-allowed"
						readonly
						value={essayTexts[q.id] ?? ''}
					></textarea>
				{:else}
					<p class="text-sm font-medium text-(--text-secondary)">Soal tidak tersedia.</p>
				{/if}

				<div class="flex justify-between gap-3 pt-4 border-t-2 border-(--nb-border)">
					<button
						class="btn-secondary"
						disabled={currentQuestionIndex === 0}
						onclick={() => currentQuestionIndex--}>← Sebelumnya</button
					>
					<button
						class="btn-primary"
						disabled={currentQuestionIndex === questions.length - 1}
						onclick={() => currentQuestionIndex++}>Selanjutnya →</button
					>
				</div>
			</div>
		{/if}
	</div>

	<aside class="flex flex-col card p-4 sticky top-4">
		<h3 class="text-xs font-black text-(--text-primary) uppercase tracking-wider mb-3">
			Navigasi Soal ({answeredCount}/{questions.length} Dijawab)
		</h3>
		<div class="grid grid-cols-5 gap-1.5">
			{#each questions as q, idx}
				{@const qId = q.question?.id ?? ''}
				{@const answered = !!(selectedOptions[qId] || essayTexts[qId]?.trim())}
				<button
					class="h-9 w-full flex items-center justify-center text-xs font-black {currentQuestionIndex ===
					idx
						? 'nav-btn-current'
						: answered
							? 'nav-btn-answered'
							: 'nav-btn'}"
					onclick={() => (currentQuestionIndex = idx)}
				>
					{idx + 1}
				</button>
			{/each}
		</div>
	</aside>
</div>
