<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import { toast } from '$lib/features/toast/toast.svelte';
	import type { Quiz, QuizSubmission, QuizQuestion, QuizSubmissionAnswer } from '$lib/features/lms/lms-store.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import QuizQuestionView from '$lib/components/QuizQuestionView.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	let quizId = $derived($page.params.id as string);
	let studentId = $derived(authState.user?.id || '');

	async function loadData() {
		const [quiz, submission] = await Promise.all([
			lmsStore.getQuiz(quizId),
			lmsStore.getMyQuizSubmission(quizId),
		]);
		return { quiz, submission };
	}

	let dataPromise = $derived(loadData());

	let answers = $state<number[]>([]);
	let starting = $state(false);
	let finishing = $state(false);
	let showStartConfirm = $state(false);
	let showFinishConfirm = $state(false);

	// Timer
	let timeRemaining = $state<number | null>(null);
	let timerInterval: ReturnType<typeof setInterval> | undefined;

	function startTimer(minutes: number) {
		timeRemaining = minutes * 60;
		timerInterval = setInterval(() => {
			if (timeRemaining !== null) {
				timeRemaining--;
				if (timeRemaining <= 0) {
					clearInterval(timerInterval);
				}
			}
		}, 1000);
	}

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	async function handleStart() {
		starting = true;
		try {
			await lmsStore.startQuiz(quizId);
			const result = await loadData();
			if (result.quiz?.timeLimit) {
				startTimer(result.quiz.timeLimit);
			}
			answers = new Array(result.quiz?.questions?.length || 0).fill(-1);
			showStartConfirm = false;
			toast.success('Kuis berhasil dimulai. Selamat mengerjakan!');
			dataPromise = loadData();
		} catch (err: any) {
			toast.error(err.message || 'Gagal memulai kuis.');
		} finally {
			starting = false;
		}
	}

	async function handleFinish() {
		finishing = true;
		try {
			const currentData = await dataPromise;
			const questions = currentData.quiz?.questions || [];
			const finalAnswers = questions.map((q, idx) => ({
				quizQuestionId: q.id,
				selectedOption: answers[idx] >= 0 ? answers[idx] : -1,
			}));
			await lmsStore.finishQuiz(quizId, finalAnswers);
			clearInterval(timerInterval);
			showFinishConfirm = false;
			toast.success('Kuis berhasil dikumpulkan!');
			dataPromise = loadData();
		} catch (err: any) {
			toast.error(err.message || 'Gagal mengumpulkan kuis.');
		} finally {
			finishing = false;
		}
	}
</script>

{#await dataPromise}
	<div class="w-full">
		<div class="animate-pulse space-y-6">
			<div class="h-8 bg-surface-container neo-border w-1/2"></div>
			<div class="h-64 bg-surface-container neo-border w-full"></div>
		</div>
	</div>
{:then { quiz, submission }}
	{#if !quiz}
		<div class="w-full">
			<div class="flex flex-col items-center justify-center p-12 bg-surface-container-lowest neo-border shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] text-center">
				<span class="material-symbols-outlined text-6xl text-error mb-4" style="font-variation-settings: 'FILL' 1;">error</span>
				<h2 class="font-headline-md text-2xl font-black mb-2">Kuis Tidak Ditemukan</h2>
				<p class="font-body-md text-secondary">Kuis yang Anda cari tidak tersedia.</p>
			</div>
		</div>
	{:else}
		<div class="w-full flex flex-col gap-6">
			<!-- Not Started -->
			{#if !submission}
				<Card>
					<div class="text-center py-8">
						<div class="w-20 h-20 bg-inverse-primary neo-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 mx-auto mb-6">
							<span class="material-symbols-outlined text-5xl">quiz</span>
						</div>
						<h2 class="font-display-lg text-3xl font-black mb-2">{quiz.title}</h2>
						<div class="flex items-center justify-center gap-4 mt-4 text-secondary">
							<div class="flex items-center gap-1">
								<span class="material-symbols-outlined text-sm">help</span>
								<span class="font-label-bold text-xs">{quiz._count?.questions || quiz.questions?.length || 0} soal</span>
							</div>
							{#if quiz.timeLimit}
								<div class="flex items-center gap-1">
									<span class="material-symbols-outlined text-sm">timer</span>
									<span class="font-label-bold text-xs">{quiz.timeLimit} menit</span>
								</div>
							{/if}
						</div>
						<div class="mt-8">
							<Button variant="primary" size="lg" onclick={() => (showStartConfirm = true)} disabled={starting}>
								Mulai Kuis
							</Button>
						</div>
					</div>
				</Card>

			<!-- Started but not finished -->
			{:else if submission.finishedAt === null}
				<div class="mb-6">
					<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
						<div>
							<h2 class="font-display-lg text-2xl font-black">{quiz.title}</h2>
							<p class="font-body-md text-secondary">Jawab semua soal dengan benar.</p>
						</div>
						<div class="flex items-center gap-4">
							{#if timeRemaining !== null}
								<div class="px-4 py-2 bg-surface neo-border font-label-bold text-lg {timeRemaining <= 60 ? 'text-error' : 'text-on-surface'}">
									<span class="material-symbols-outlined text-sm align-middle mr-1">timer</span>
									{formatTime(timeRemaining)}
								</div>
							{/if}
							<Button variant="primary" onclick={() => (showFinishConfirm = true)} disabled={finishing}>
								Kumpulkan Kuis
							</Button>
						</div>
					</div>

					<QuizQuestionView questions={quiz.questions || []} bind:answers />
				</div>

			<!-- Finished -->
			{:else}
				<Card>
					<div class="text-center py-8">
						<div class="w-20 h-20 bg-primary-container neo-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-3 mx-auto mb-6">
							<span class="material-symbols-outlined text-5xl">checklist</span>
						</div>
						<h2 class="font-display-lg text-3xl font-black mb-2">{quiz.title}</h2>
						<div class="mt-6">
							<Badge variant="success">Selesai</Badge>
						</div>
						<div class="mt-6">
							<div class="inline-flex items-center gap-3 bg-on-surface text-surface neo-border px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
								<span class="font-headline-md text-2xl font-black">Skor Anda</span>
								<span class="font-display-lg text-4xl font-black">{submission.score ?? 0}</span>
							</div>
						</div>
						<div class="mt-4 text-secondary font-body-md">
							Selesai: {new Date(submission.finishedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
						</div>
					</div>
				</Card>

				<!-- Review Answers -->
				<div class="mt-8">
					<h3 class="font-headline-md text-xl font-bold mb-6 flex items-center gap-2">
						<span class="material-symbols-outlined">rate_review</span>
						Tinjau Jawaban
					</h3>

					{#if quiz.questions && submission.answers}
						{@const correctAnswers = quiz.questions.map((q) => q.correctOption ?? -1)}
						{@const submittedAnswers = quiz.questions.map((q) => {
							const answer = submission.answers?.find((a) => a.quizQuestionId === q.id);
							return answer?.selectedOption ?? -1;
						})}
						<QuizQuestionView
							questions={quiz.questions}
							answers={submittedAnswers}
							showCorrect={true}
							correctAnswers={correctAnswers}
						/>
					{/if}
				</div>

				<div class="mt-6">
					<Button variant="outline" onclick={() => goto(`/student/classes/${quiz.classId}`)}>
						<span class="material-symbols-outlined">arrow_back</span>
						Kembali ke Kelas
					</Button>
				</div>
			{/if}
		</div>

		<!-- Confirmation Modals -->
		<ConfirmationModal
			bind:open={showStartConfirm}
			title="Mulai Kuis?"
			message="Setelah memulai kuis, waktu akan berjalan dan tidak dapat dijeda. Apakah Anda siap?"
			confirmText="Ya, Mulai"
			cancelText="Belum Siap"
			icon="quiz"
			variant="primary"
			loading={starting}
			onconfirm={handleStart}
		/>

		<ConfirmationModal
			bind:open={showFinishConfirm}
			title="Kumpulkan Kuis?"
			message="Apakah Anda yakin ingin mengumpulkan kuis ini? Jawaban yang belum diisi akan dianggap kosong."
			confirmText="Ya, Kumpulkan"
			cancelText="Cek Lagi"
			icon="assignment_turned_in"
			variant="warning"
			loading={finishing}
			onconfirm={handleFinish}
		/>
	{/if}
{:catch err}
	<div class="max-w-3xl mx-auto mt-4">
		<div class="bg-error-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
			<p class="font-bold text-error text-lg">Gagal memuat kuis.</p>
			<p class="text-error text-sm mt-2">{err.message}</p>
		</div>
	</div>
{/await}
