<script lang="ts">
	import { enhance } from '$app/forms';
	import Modal from '$lib/components/modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import { addToast } from '$lib/stores/toast';
	import { resolveBackendUrl } from '$lib/utils/backend-url';

	let { data, form }: { data: any; form: any } = $props();

	const templateUrl = resolveBackendUrl() + '/api/v1/questions/template';

	type Question = NonNullable<(typeof data.questions)[0]>;

	const optionLabel = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : String(i + 1));

	let showAdd = $state(false);
	let showImport = $state(false);
	let submitting = $state(false);
	let questionType = $state<'MULTIPLE_CHOICE' | 'ESSAY'>('MULTIPLE_CHOICE');
	let options = $state(['', '', '', '']);
	let correctIndex = $state(0);

	function addOptionSlot() {
		options = [...options, ''];
	}
	function removeOptionSlot(i: number) {
		if (options.length <= 2) return;
		options = options.filter((_, j) => j !== i);
		if (correctIndex >= options.length) correctIndex = options.length - 1;
		else if (correctIndex > i) correctIndex--;
	}

	let editItem = $state<Question | null>(null);
	let editType = $state<'MULTIPLE_CHOICE' | 'ESSAY'>('MULTIPLE_CHOICE');
	let editOptions = $state<{ text: string; existingId: string | null }[]>([]);
	let editCorrectIndex = $state(0);
	let editDeletedOptionIds = $state<string[]>([]);

	function openEdit(eq: Question) {
		editItem = eq;
		editType = eq.question?.type ?? 'MULTIPLE_CHOICE';
		const opts = eq.question?.options ?? [];
		editOptions = opts.map((o: any) => ({ text: o.text, existingId: o.id }));
		editDeletedOptionIds = [];
		const correctOptId = eq.question?.correctAnswer?.optionId;
		editCorrectIndex = editOptions.findIndex((o: any) => o.existingId === correctOptId);
		if (editCorrectIndex < 0) editCorrectIndex = 0;
	}

	function addEditOptionSlot() {
		editOptions = [...editOptions, { text: '', existingId: null }];
	}
	function removeEditOptionSlot(i: number) {
		if (editOptions.length <= 2) return;
		const opt = editOptions[i];
		if (opt.existingId) editDeletedOptionIds = [...editDeletedOptionIds, opt.existingId];
		editOptions = editOptions.filter((_, j) => j !== i);
		if (editCorrectIndex >= editOptions.length) editCorrectIndex = editOptions.length - 1;
		else if (editCorrectIndex > i) editCorrectIndex--;
	}

	function closeAdd() {
		showAdd = false;
		questionType = 'MULTIPLE_CHOICE';
		options = ['', '', '', ''];
		correctIndex = 0;
	}
	function closeImport() {
		showImport = false;
	}
	function closeEdit() {
		editItem = null;
		editDeletedOptionIds = [];
	}

	let questionToRemove = $state<Question | null>(null);
	let removeQuestionForm: HTMLFormElement;

	function makeEnhance(onSuccess: () => void) {
		return () => {
			submitting = true;
			return async ({ update, result }: any) => {
				submitting = false;
				if (result.type === 'success') {
					onSuccess();
					addToast(result.data?.message ?? 'Berhasil.', 'success');
				} else if (result.type === 'failure') {
					addToast(result.data?.error ?? 'Terjadi kesalahan.', 'error');
				}
				await update({ invalidateAll: true });
			};
		};
	}

	const typeLabel: Record<string, string> = { MULTIPLE_CHOICE: 'Pilihan Ganda', ESSAY: 'Esai' };
</script>

<div class="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
	<div>
		<a
			href="/supervisor/questions"
			class="inline-flex items-center gap-1 text-sm font-bold mb-1 text-primary-500 transition-all duration-100 hover:-translate-x-0.5"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2.5"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
			Kembali
		</a>
		<h1 class="text-xl sm:text-2xl font-black text-(--text-primary)">
			{data.exam?.name ?? 'Soal Ujian'}
		</h1>
		<p class="text-sm font-medium text-(--text-secondary)">
			{data.examRoomIds.length} ruangan &bull; {data.questions.length} soal
		</p>
	</div>
	<div class="flex gap-2 w-full sm:w-auto">
		<Button variant="secondary" class="flex-1 sm:flex-none" onclick={() => (showImport = true)}>
			<svg class="mr-2 w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
				/>
			</svg>
			Import Excel
		</Button>
		<Button class="flex-1 sm:flex-none" onclick={() => (showAdd = true)}>
			<svg class="mr-2 w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Tambah Soal
		</Button>
	</div>
</div>

{#if data.questions.length === 0}
	<div class="card p-10 text-center">
		<svg
			class="mx-auto w-12 h-12 mb-3 text-(--text-secondary)"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.5"
				d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<p class="font-black text-(--text-primary)">Belum ada soal</p>
		<p class="text-sm font-medium text-(--text-secondary) mt-1">
			Klik "Tambah Soal" untuk mulai membuat soal ujian.
		</p>
	</div>
{:else}
	<div class="space-y-4">
		{#each data.questions as eq (eq.id)}
			{@const q = eq.question}
			<div class="card p-5">
				<div class="flex items-start justify-between gap-4">
					<div class="flex items-start gap-3 flex-1 min-w-0">
						<span
							class="avatar-pill shrink-0 w-7 h-7 flex items-center justify-center text-xs font-black text-white"
						>
							{eq.questionNumber}
						</span>
						<div class="min-w-0 flex-1">
							<p class="font-bold text-(--text-primary) leading-relaxed">{q?.text ?? '-'}</p>
							<Badge
								variant={q?.type === 'MULTIPLE_CHOICE' ? 'info' : 'warning'}
								class="mt-1.5 font-black"
							>
								{typeLabel[q?.type ?? ''] ?? q?.type}
							</Badge>
						</div>
					</div>
					<div class="flex items-center gap-1 shrink-0">
						<Button
							variant="primary-outline"
							size="icon"
							onclick={() => openEdit(eq)}
							title="Edit soal"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</Button>
						<Button
							variant="danger-outline"
							size="icon"
							type="button"
							title="Hapus soal"
							onclick={(e) => {
								e.preventDefault();
								questionToRemove = eq;
							}}
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</Button>
					</div>
				</div>

				{#if q?.options && q.options.length > 0}
					<ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
						{#each q.options as opt, i}
							{@const isCorrect = q.correctAnswer?.optionId === opt.id}
							<li
								class="flex items-start gap-2.5 p-2.5 text-sm {isCorrect
									? 'answer-opt-correct-unchosen'
									: 'answer-opt'}"
							>
								<span
									class="shrink-0 w-5 h-5 flex items-center justify-center text-white text-xs font-black {isCorrect
										? 'opt-label-correct'
										: 'opt-label'}"
								>
									{optionLabel(i)}
								</span>
								<span class="font-medium {isCorrect ? 'text-green-700' : 'text-(--text-primary)'}"
									>{opt.text}</span
								>
								{#if isCorrect}
									<svg
										class="ml-auto shrink-0 w-4 h-4 text-green-600"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<!-- Modal Import Excel -->
<Modal show={showImport} onClose={closeImport}>
	<h2 class="text-lg font-black text-(--text-primary) mb-1">Import Soal dari Excel</h2>
	<div class="flex items-start justify-between mb-4">
		<p class="text-sm font-medium text-(--text-secondary)">
			Soal akan ditambahkan ke semua <strong class="font-black text-(--text-primary)"
				>{data.examRoomIds.length}</strong
			> ruangan ujian.
		</p>
		<a href={templateUrl} download="template_soal.xlsx" class="btn-secondary text-xs shrink-0 ml-3">
			Download Template
		</a>
	</div>

	<form
		method="POST"
		action="?/importExcel"
		enctype="multipart/form-data"
		class="space-y-4"
		use:enhance={makeEnhance(closeImport)}
	>
		<input type="hidden" name="examId" value={data.examId} />
		{#each data.examRoomIds as roomId}
			<input type="hidden" name="examRoomId" value={roomId} />
		{/each}
		<FormField
			label="File Excel (.xlsx)"
			hint="Gunakan template di atas. Pilihan jawaban bersifat dinamis: tambah kolom option_e, option_f, dst."
		>
			<input name="file" type="file" accept=".xlsx" class="input-field" required />
		</FormField>
		<div class="flex justify-end gap-3 pt-2">
			<Button variant="secondary" onclick={closeImport}>Tutup</Button>
			<Button type="submit" loading={submitting}
				>{submitting ? 'Mengimport...' : 'Import Soal'}</Button
			>
		</div>
	</form>
</Modal>

<!-- Modal Tambah Soal -->
<Modal show={showAdd} onClose={closeAdd} size="lg">
	<h2 class="text-lg font-black text-(--text-primary) mb-1">Tambah Soal Baru</h2>
	<p class="text-sm font-medium text-(--text-secondary) mb-4">
		Soal akan ditambahkan ke semua {data.examRoomIds.length} ruangan ujian.
	</p>
	<form method="POST" action="?/addQuestion" class="space-y-4" use:enhance={makeEnhance(closeAdd)}>
		<input type="hidden" name="examId" value={data.examId} />
		{#each data.examRoomIds as roomId}
			<input type="hidden" name="examRoomId" value={roomId} />
		{/each}
		<div class="flex gap-3">
			<Select name="type" label="Tipe Soal" bind:value={questionType} required class="flex-1">
				<option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
				<option value="ESSAY">Esai</option>
			</Select>
			<FormField label="No. Soal" class="w-28">
				<input
					name="questionNumber"
					type="number"
					class="input-field"
					value={data.nextNumber}
					min="1"
					required
				/>
			</FormField>
		</div>
		<Textarea
			name="text"
			label="Teks Soal"
			rows={3}
			placeholder="Tulis pertanyaan di sini..."
			required
		/>

		{#if questionType === 'MULTIPLE_CHOICE'}
			<div>
				<p class="block text-sm font-black text-(--text-primary) mb-2">
					Pilihan Jawaban <span class="text-xs font-medium text-(--text-secondary) ml-1"
						>(tandai jawaban yang benar)</span
					>
				</p>
				<input type="hidden" name="optionCount" value={options.length} />
				<div class="space-y-2">
					{#each options as _, i}
						<div class="flex items-center gap-2">
							<label class="shrink-0 flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="correct"
									value={i}
									checked={correctIndex === i}
									onchange={() => (correctIndex = i)}
									class="sr-only"
									required
								/>
								<div
									class="w-5 h-5 flex items-center justify-center text-xs font-black transition-all duration-100 {correctIndex ===
									i
										? 'option-radio-btn-selected'
										: 'option-radio-btn'}"
								>
									{optionLabel(i)}
								</div>
							</label>
							<input
								name="option_{i}"
								type="text"
								class="input-field flex-1"
								placeholder="Pilihan {optionLabel(i)}"
								bind:value={options[i]}
								required
							/>
							{#if options.length > 2}
								<button
									type="button"
									class="btn-danger-outline shrink-0 p-1.5 transition-all duration-100 hover:translate-x-0.5 hover:translate-y-0.5"
									onclick={() => removeOptionSlot(i)}
									title="Hapus opsi"
								>
									<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2.5"
											d="M6 18L18 6M6 6l12 12"
										/></svg
									>
								</button>
							{:else}
								<span class="w-8 shrink-0"></span>
							{/if}
						</div>
					{/each}
				</div>
				<button
					type="button"
					class="mt-2 text-sm font-bold flex items-center gap-1 text-primary-500 transition-all duration-100 hover:translate-x-0.5 hover:translate-y-0.5"
					onclick={addOptionSlot}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2.5"
							d="M12 4v16m8-8H4"
						/></svg
					>
					Tambah Opsi
				</button>
			</div>
		{/if}

		<div class="flex justify-end gap-3 pt-2">
			<Button variant="secondary" onclick={closeAdd}>Batal</Button>
			<Button type="submit" loading={submitting}
				>{submitting ? 'Menyimpan...' : 'Simpan Soal'}</Button
			>
		</div>
	</form>
</Modal>

<!-- Modal Edit Soal -->
<Modal show={!!editItem} onClose={closeEdit} size="lg">
	<h2 class="text-lg font-black text-(--text-primary) mb-4">Edit Soal</h2>
	{#if editItem}
		<form
			method="POST"
			action="?/editQuestion"
			class="space-y-4"
			use:enhance={makeEnhance(closeEdit)}
		>
			<input type="hidden" name="examId" value={data.examId} />
			<input type="hidden" name="questionId" value={editItem.questionId} />
			<input type="hidden" name="questionNumber" value={editItem.questionNumber} />
			{#each editItem.allExamQuestionIds as eqId}
				<input type="hidden" name="examQuestionId" value={eqId} />
			{/each}
			{#if editItem.question?.correctAnswer}
				<input
					type="hidden"
					name="existingCorrectAnswerId"
					value={editItem.question.correctAnswer.id}
				/>
			{/if}
			{#each editDeletedOptionIds as id}
				<input type="hidden" name="deletedOptionId" value={id} />
			{/each}

			<div class="flex gap-3">
				<Select name="type" label="Tipe Soal" bind:value={editType} required class="flex-1">
					<option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
					<option value="ESSAY">Esai</option>
				</Select>
				<FormField label="No. Soal" class="w-28">
					<input
						name="questionNumber"
						type="number"
						class="input-field"
						value={editItem.questionNumber}
						min="1"
						required
					/>
				</FormField>
			</div>
			<FormField label="Teks Soal">
				<textarea name="text" class="input-field resize-none" rows="3" required
					>{editItem.question?.text ?? ''}</textarea
				>
			</FormField>

			{#if editType === 'MULTIPLE_CHOICE'}
				<div>
					<p class="block text-sm font-black text-(--text-primary) mb-2">
						Pilihan Jawaban <span class="text-xs font-medium text-(--text-secondary) ml-1"
							>(tandai jawaban yang benar)</span
						>
					</p>
					<input type="hidden" name="optionCount" value={editOptions.length} />
					<div class="space-y-2">
						{#each editOptions as opt, i}
							<div class="flex items-center gap-2">
								<label class="shrink-0 flex items-center gap-2 cursor-pointer">
									<input
										type="radio"
										name="correct"
										value={i}
										checked={editCorrectIndex === i}
										onchange={() => (editCorrectIndex = i)}
										class="sr-only"
										required
									/>
									<div
										class="w-5 h-5 flex items-center justify-center text-xs font-black transition-all duration-100 {editCorrectIndex ===
										i
											? 'option-radio-btn-selected'
											: 'option-radio-btn'}"
									>
										{optionLabel(i)}
									</div>
								</label>
								<input type="hidden" name="existingOptionId_{i}" value={opt.existingId ?? ''} />
								<input
									name="option_{i}"
									type="text"
									class="input-field flex-1"
									placeholder="Pilihan {optionLabel(i)}"
									bind:value={opt.text}
									required
								/>
								{#if editOptions.length > 2}
									<button
										type="button"
										class="btn-danger-outline shrink-0 p-1.5 transition-all duration-100 hover:translate-x-0.5 hover:translate-y-0.5"
										onclick={() => removeEditOptionSlot(i)}
										title="Hapus opsi"
									>
										<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"
											><path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2.5"
												d="M6 18L18 6M6 6l12 12"
											/></svg
										>
									</button>
								{:else}
									<span class="w-8 shrink-0"></span>
								{/if}
							</div>
						{/each}
					</div>
					<button
						type="button"
						class="mt-2 text-sm font-bold flex items-center gap-1 text-primary-500 transition-all duration-100 hover:translate-x-0.5 hover:translate-y-0.5"
						onclick={addEditOptionSlot}
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M12 4v16m8-8H4"
							/></svg
						>
						Tambah Opsi
					</button>
				</div>
			{/if}

			<div class="flex justify-end gap-3 pt-2">
				<Button variant="secondary" onclick={closeEdit}>Batal</Button>
				<Button type="submit" loading={submitting}
					>{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}</Button
				>
			</div>
		</form>
	{/if}
</Modal>

<form bind:this={removeQuestionForm} method="POST" action="?/deleteQuestion" use:enhance={makeEnhance(() => {})}>
	<input type="hidden" name="examId" value={data.examId} />
	{#if questionToRemove}
		{#each questionToRemove.allExamQuestionIds as eqId}
			<input type="hidden" name="examQuestionId" value={eqId} />
		{/each}
		<input type="hidden" name="questionId" value={questionToRemove.questionId} />
	{/if}
</form>

<ConfirmModal
	show={!!questionToRemove}
	title="Konfirmasi Hapus"
	message="Hapus soal ini dari semua ruangan?"
	onCancel={() => (questionToRemove = null)}
	onConfirm={() => {
		removeQuestionForm.requestSubmit();
		questionToRemove = null;
	}}
/>
