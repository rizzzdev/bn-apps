<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';

	let title = $state('');
	let description = $state('');
	let deadline = $state('');
	let attachments = $state<{ url: string; name: string }[]>([]);
	let selectedClassIds = $state<string[]>([]);
	let status = $state<'Draft' | 'Published'>('Draft');
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

	function getDefaultDeadline() {
		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);
		nextWeek.setMinutes(nextWeek.getMinutes() - nextWeek.getTimezoneOffset());
		return nextWeek.toISOString().slice(0, 16);
	}

	$effect(() => {
		async function load() {
			loadingClasses = true;
			try {
				classes = await lmsStore.getTeacherClasses();
				const urlClassId = $page.url.searchParams.get('classId');
				if (urlClassId && classes.some((c) => c.id === urlClassId)) {
					selectedClassIds = [urlClassId];
				}
				if (!deadline) {
					deadline = getDefaultDeadline();
				}
			} catch (err: any) {
				errorMsg = err.message || 'Gagal memuat kelas';
			} finally {
				loadingClasses = false;
			}
		}
		load();
	});

	async function handleSubmit() {
		if (selectedClassIds.length === 0) {
			errorMsg = 'Silakan pilih minimal 1 kelas';
			return;
		}
		if (title.trim().length < 3) {
			errorMsg = 'Judul tugas minimal 3 karakter';
			return;
		}
		if (!description || description.trim() === '' || description === '<p></p>') {
			errorMsg = 'Deskripsi tugas tidak boleh kosong';
			return;
		}
		if (!deadline) {
			errorMsg = 'Silakan tentukan deadline tugas';
			return;
		}

		submitting = true;
		errorMsg = '';
		try {
			const result = await lmsStore.bulkCreateAssignment({
				title: title.trim(),
				description,
				deadline: new Date(deadline).toISOString(),
				classIds: selectedClassIds,
				status,
				attachments: attachments.map((a) => ({ fileUrl: a.url, fileName: a.name }))
			});
			goto('/teacher/assignments');
		} catch (err: any) {
			errorMsg = err.message || 'Gagal membuat tugas';
		} finally {
			submitting = false;
		}
	}

	// Derived: selected class names for chip display
	let selectedClassNames = $derived(
		selectedClassIds.map((id) => classes.find((c) => c.id === id)?.name ?? id)
	);
</script>

<svelte:head>
	<title>Tambah Tugas - Akademik-BN</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<div class="mb-6 flex items-center gap-4">
		<Button variant="outline" onclick={() => goto('/teacher/assignments')}>
			<span class="material-symbols-outlined text-sm">arrow_back</span>
			Kembali
		</Button>
		<h2 class="text-2xl font-black">Tambah Tugas Baru</h2>
	</div>

	<Card>
		{#if loadingClasses}
			<p class="font-bold text-secondary text-center py-4">Memuat kelas...</p>
		{:else}
			<form onsubmit={(e) => e.preventDefault()} class="flex flex-col gap-5">
				<Input label="Judul Tugas" bind:value={title} placeholder="Masukkan judul tugas..." required />

				<div class="flex flex-col gap-1">
					<span class="font-label-bold text-sm">Deskripsi Tugas <span class="text-error">*</span></span>
					<RichTextEditor bind:value={description} placeholder="Tulis instruksi atau deskripsi tugas..." />
				</div>

				<Input label="Batas Waktu (Deadline)" type="datetime-local" bind:value={deadline} required />

				<div class="flex flex-col gap-1">
					<span class="font-label-bold text-sm">Lampiran File (Opsional)</span>
					<FileUpload bind:files={attachments} multiple label="Upload Lampiran Tugas" />
				</div>

				<!-- Kelas Multi-Select & Status -->
				<div class="flex flex-col gap-4 border-t-2 border-on-surface/20 pt-4 mt-2">
					<div class="flex flex-col gap-2">
						<CustomSelect
							label="Pilih Kelas Target (dapat pilih lebih dari 1)"
							options={classOptions}
							bind:value={selectedClassIds}
							multiple={true}
							placeholder="Pilih satu atau lebih kelas..."
							required={true}
						/>

						<!-- Chips kelas yang dipilih -->
						{#if selectedClassNames.length > 0}
							<div class="flex flex-wrap gap-2 mt-1">
								{#each selectedClassNames as name, i}
									<div class="inline-flex items-center gap-1.5 bg-primary-container border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] px-2.5 py-1 font-label-bold text-xs">
										<span class="material-symbols-outlined text-sm">school</span>
										{name}
										<button
											type="button"
											onclick={() => { selectedClassIds = selectedClassIds.filter((_, idx) => idx !== i); }}
											class="ml-0.5 hover:text-error transition-colors"
											aria-label="Hapus {name}"
										>
											<span class="material-symbols-outlined text-sm leading-none">close</span>
										</button>
									</div>
								{/each}
							</div>
						{/if}

						{#if selectedClassIds.length > 1}
							<p class="text-xs font-label-bold text-secondary flex items-center gap-1">
								<span class="material-symbols-outlined text-sm">info</span>
								Tugas akan dibuat untuk <strong>{selectedClassIds.length} kelas</strong> secara terpisah.
							</p>
						{/if}
					</div>

					<CustomSelect
						label="Status Publikasi"
						options={statusOptions}
						bind:value={status}
						multiple={false}
						placeholder="Pilih status..."
						required={true}
					/>
				</div>

				{#if errorMsg}
					<div class="bg-error/10 border-2 border-error p-3 neo-border text-error text-sm font-label-bold flex items-center gap-2">
						<span class="material-symbols-outlined text-base">error</span>
						<span>{errorMsg}</span>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="mt-4 flex justify-end items-center">
					<Button
						type="button"
						variant="primary"
						disabled={submitting || selectedClassIds.length === 0}
						onclick={() => handleSubmit()}
					>
						<span class="material-symbols-outlined text-sm">save</span>
						{#if submitting}
							Menyimpan...
						{:else if selectedClassIds.length > 1}
							Simpan untuk {selectedClassIds.length} Kelas
						{:else}
							Simpan
						{/if}
					</Button>
				</div>
			</form>
		{/if}
	</Card>
</div>
