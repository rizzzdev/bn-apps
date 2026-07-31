<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { lmsStore, type QuizQuestion } from '$lib/features/lms/lms-store.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import QuizQuestionEditor from '$lib/components/QuizQuestionEditor.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';

	let quizId = $derived($page.params.id as string);

	let title = $state('');
	let timeLimit = $state<number | undefined>(undefined);
	let status = $state<'Draft' | 'Published'>('Draft');
	let questions = $state<{ question: string; options: string[]; correctOption: number }[]>([]);
	let selectedClassIds = $state<string[]>([]);
	let classes: Awaited<ReturnType<typeof lmsStore.getTeacherClasses>> = $state([]);
	let loading = $state(true);
	let submitting = $state(false);
	let errorMsg = $state('');

	let classOptions = $derived<SelectOption[]>(
		classes.map((c) => ({
			value: c.id,
			label: c.name,
			description: c.major?.name
		}))
	);

	const statusOptions: SelectOption[] = [
		{ value: 'Draft', label: 'Draft (Simpan Sementara)' },
		{ value: 'Published', label: 'Published (Publikasikan)' }
	];

	$effect(() => {
		async function load() {
			loading = true;
			try {
				const [fetchedClasses, quiz] = await Promise.all([
					lmsStore.getTeacherClasses(),
					lmsStore.getQuiz(quizId)
				]);
				classes = fetchedClasses;

				if (quiz) {
					title = quiz.title;
					timeLimit = quiz.timeLimit ?? undefined;
					status = quiz.status || 'Draft';
					selectedClassIds = quiz.classes && quiz.classes.length > 0 ? quiz.classes.map((c) => c.classId) : (quiz.classId ? [quiz.classId] : []);
					if (quiz.questions) {
						questions = quiz.questions.map((q) => ({
							question: q.question,
							options: [...q.options],
							correctOption: q.correctOption ?? 0
						}));
					}
				} else {
					errorMsg = 'Kuis tidak ditemukan';
				}
			} catch (err: any) {
				errorMsg = err.message || 'Gagal memuat kuis';
			} finally {
				loading = false;
			}
		}
		load();
	});

	async function handleSubmit(targetStatus?: 'Draft' | 'Published') {
		const finalStatus = targetStatus ?? status;
		if (selectedClassIds.length === 0) {
			errorMsg = 'Silakan pilih kelas target';
			return;
		}
		if (title.trim().length < 3) {
			errorMsg = 'Judul kuis minimal 3 karakter';
			return;
		}
		if (questions.length === 0) {
			errorMsg = 'Minimal tambahkan 1 soal kuis';
			return;
		}

		submitting = true;
		errorMsg = '';
		try {
			await lmsStore.updateQuiz(quizId, {
				title: title.trim(),
				timeLimit: timeLimit && timeLimit > 0 ? Number(timeLimit) : undefined,
				status: finalStatus,
				classIds: selectedClassIds,
				questions: questions.map((q) => ({
					question: q.question,
					options: q.options,
					correctOption: q.correctOption,
				})),
			});
			goto(`/teacher/quizzes/${quizId}`);
		} catch (err: any) {
			errorMsg = err.message || 'Gagal memperbarui kuis';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Kuis - Akademik-BN</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<div class="mb-6 flex items-center gap-4">
		<Button variant="outline" onclick={() => goto(`/teacher/quizzes/${quizId}`)}>Kembali</Button>
		<h2 class="text-2xl font-black">Edit Kuis</h2>
	</div>

	<Card>
		{#if loading}
			<div class="p-8 text-center">
				<span class="material-symbols-outlined text-4xl text-secondary mb-2">hourglass</span>
				<p class="font-bold text-secondary">Memuat kuis...</p>
			</div>
		{:else if errorMsg && !title}
			<div class="p-8 text-center">
				<span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
				<p class="font-bold text-error">{errorMsg}</p>
			</div>
		{:else}
			<form onsubmit={(e) => e.preventDefault()} class="flex flex-col gap-5">
				<Input label="Judul Kuis" bind:value={title} placeholder="Masukkan judul kuis..." required />

				<div class="flex flex-col gap-1">
					<label class="font-label-bold text-sm" for="timeLimit">Batas Waktu (menit)</label>
					<input
						id="timeLimit"
						type="number"
						min="1"
						bind:value={timeLimit}
						placeholder="Kosongkan jika tanpa batas waktu"
						class="w-full bg-surface-container-lowest neo-border py-3 px-4 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-on-surface/20 pt-4 mt-2">
					<CustomSelect
						label="Pilih Kelas Target"
						options={classOptions}
						bind:value={selectedClassIds}
						multiple={true}
						placeholder="Pilih satu atau beberapa kelas..."
						required={true}
					/>

					<CustomSelect
						label="Status Publikasi"
						options={statusOptions}
						bind:value={status}
						multiple={false}
						placeholder="Pilih status..."
						required={true}
					/>
				</div>

				<div class="flex flex-col gap-1 border-t-2 border-on-surface/20 pt-4 mt-2">
					<span class="font-label-bold text-sm">Soal-soal Kuis <span class="text-error">*</span></span>
					<QuizQuestionEditor bind:questions />
				</div>

				{#if errorMsg}
					<div class="bg-error/10 border-2 border-error p-3 neo-border text-error text-sm font-label-bold flex items-center gap-2">
						<span class="material-symbols-outlined text-base">error</span>
						<span>{errorMsg}</span>
					</div>
				{/if}

				<div class="mt-4 flex justify-end items-center">
					<Button
						type="button"
						variant="primary"
						disabled={submitting}
						onclick={() => handleSubmit(status)}
					>
						<span class="material-symbols-outlined text-sm">save</span>
						{submitting ? 'Menyimpan...' : 'Simpan'}
					</Button>
				</div>
			</form>
		{/if}
	</Card>
</div>
