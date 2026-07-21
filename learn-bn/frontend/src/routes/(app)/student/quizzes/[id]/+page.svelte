<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';

	let quizId = $derived($page.params.id as string);
	let quiz = $derived(lmsStore.quizzes.find((q) => q.id === quizId));
	let questions = $derived(lmsStore.quizQuestions.filter((q) => q.quizId === quizId));
	let studentId = $derived(authState.user?.id || '');

	// Track selected answers per question index
	let answers = $state<number[]>([]);

	function submitQuiz() {
		lmsStore.submitQuiz(quizId, studentId, answers);
		alert('Kuis berhasil dikumpulkan!');
		goto(`/student/classes/${quiz?.classId}`);
	}
</script>

<div class="max-w-3xl mx-auto">
	{#if !quiz}
		<p class="font-bold text-error">Kuis tidak ditemukan.</p>
	{:else}
		<div class="mb-6 flex justify-between items-end">
			<div>
				<h2 class="text-2xl font-black">{quiz.title}</h2>
				<p class="text-sm font-bold">Jawablah pertanyaan di bawah ini dengan benar.</p>
			</div>
			<Button variant="primary" onclick={submitQuiz}>Kumpulkan Kuis</Button>
		</div>

		<div class="flex flex-col gap-6">
			{#each questions as q, idx}
				<Card>
					<h4 class="font-bold mb-4">{idx + 1}. {q.text}</h4>
					<div class="flex flex-col gap-2">
						{#each q.options as opt, optIdx}
							<label
								class="flex items-center gap-3 p-3 border-2 border-on-background cursor-pointer hover:bg-gray-100 {answers[
									idx
								] === optIdx
									? 'bg-secondary/20 border-secondary'
									: 'bg-surface'}"
							>
								<input
									type="radio"
									name={`q-${q.id}`}
									value={optIdx}
									bind:group={answers[idx]}
									class="w-4 h-4 accent-secondary"
								/>
								<span class="font-bold text-sm">{opt}</span>
							</label>
						{/each}
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>
