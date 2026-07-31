<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import QuizQuestionEditor from '$lib/components/QuizQuestionEditor.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';

	let classIdFromUrl = $derived($page.url.searchParams.get('classId') || '');

	let title = $state('');
	let timeLimit = $state<number | undefined>(undefined);
	let status = $state<'Draft' | 'Published'>('Draft');
	let questions = $state<{ question: string; options: string[]; correctOption: number }[]>([]);
	let selectedClassIds = $state<string[]>([]);
	let classes: Awaited<ReturnType<typeof lmsStore.getTeacherClasses>> = $state([]);
	let loadingClasses = $state(true);
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
		{ value: 'Published', label: 'Published (Publikasikan Langsung)' }
	];

	$effect(() => {
		async function load() {
			loadingClasses = true;
			try {
				classes = await lmsStore.getTeacherClasses();
				const urlClassId = $page.url.searchParams.get('classId');
				if (urlClassId && classes.some((c) => c.id === urlClassId)) {
					selectedClassIds = [urlClassId];
				} else if (selectedClassIds.length === 0 && classes.length > 0) {
					selectedClassIds = [classes[0].id];
				}
			} catch (err: any) {
				errorMsg = err.message || 'Gagal memuat kelas';
			} finally {
				loadingClasses = false;
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
			await lmsStore.createQuiz({
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
			if (selectedClassIds.length === 1) {
				goto(`/teacher/classes/${selectedClassIds[0]}/quizzes`);
			} else {
				goto('/teacher/quizzes');
			}
		} catch (err: any) {
			errorMsg = err.message || 'Gagal membuat kuis';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Tambah Kuis - Akademik-BN</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<div class="mb-6 flex items-center gap-4">
		<Button variant="outline" onclick={() => goto('/teacher/quizzes')}>Kembali</Button>
		<h2 class="text-2xl font-black">Tambah Kuis Baru</h2>
	</div>

	<Card>
		{#if loadingClasses}
			<p class="font-bold text-secondary text-center py-4">Memuat kelas...</p>
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

				<div class="mt-4 flex justify-end items-center gap-3">
					<Button
						type="button"
						variant="outline"
						disabled={submitting || selectedClassIds.length === 0}
						onclick={() => handleSubmit('Draft')}
					>
						<span class="material-symbols-outlined text-sm">drafts</span>
						{submitting ? 'Menyimpan...' : 'Simpan sebagai Draft'}
					</Button>
					<Button
						type="button"
						variant="primary"
						disabled={submitting || selectedClassIds.length === 0}
						onclick={() => handleSubmit(status)}
					>
						<span class="material-symbols-outlined text-sm">send</span>
						{submitting ? 'Menyimpan...' : status === 'Published' ? 'Publikasikan' : 'Simpan Kuis'}
					</Button>
				</div>
			</form>
		{/if}
	</Card>
</div>
