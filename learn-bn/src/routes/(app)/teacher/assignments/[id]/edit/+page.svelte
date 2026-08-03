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

	let assignmentId = $derived($page.params.id as string);

	let title = $state('');
	let description = $state('');
	let deadline = $state('');
	let attachments = $state<{ url: string; name: string }[]>([]);
	let selectedClassIds = $state<string[]>([]);
	let status = $state<'Draft' | 'Published'>('Draft');
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
		{ value: 'Published', label: 'Published (Publikasikan Langsung)' }
	];

	function formatDatetimeLocal(isoString: string) {
		if (!isoString) return '';
		const d = new Date(isoString);
		d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
		return d.toISOString().slice(0, 16);
	}

	$effect(() => {
		async function load() {
			loading = true;
			try {
				const [fetchedClasses, fetchedAssignment] = await Promise.all([
					lmsStore.getTeacherClasses(),
					lmsStore.getAssignment(assignmentId)
				]);
				classes = fetchedClasses;
				if (fetchedAssignment) {
					title = fetchedAssignment.title;
					description = fetchedAssignment.description;
					deadline = formatDatetimeLocal(fetchedAssignment.deadline);
					status = fetchedAssignment.status || 'Draft';
					// Populate classIds from classes junction
					selectedClassIds = fetchedAssignment.classes?.map((c) => c.classId) ?? [];
					attachments = (fetchedAssignment.attachments || []).map((att) => ({
						url: att.fileUrl,
						name: att.fileName
					}));
				} else {
					errorMsg = 'Tugas tidak ditemukan';
				}
			} catch (err: any) {
				errorMsg = err.message || 'Gagal memuat data tugas';
			} finally {
				loading = false;
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
			await lmsStore.updateAssignment(assignmentId, {
				title: title.trim(),
				description,
				deadline: new Date(deadline).toISOString(),
				classIds: selectedClassIds,
				status,
				attachments: attachments.map((a) => ({ fileUrl: a.url, fileName: a.name }))
			});
			goto(`/teacher/assignments/${assignmentId}`);
		} catch (err: any) {
			errorMsg = err.message || 'Gagal memperbarui tugas';
		} finally {
			submitting = false;
		}
	}

	let selectedClassNames = $derived(
		selectedClassIds.map((id) => classes.find((c) => c.id === id)?.name ?? id)
	);
</script>

<svelte:head>
	<title>Edit Tugas - Akademik-BN</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<div class="mb-6 flex items-center gap-4">
		<Button variant="outline" onclick={() => goto(`/teacher/assignments/${assignmentId}`)}>
			<span class="material-symbols-outlined text-sm">arrow_back</span>
			Kembali
		</Button>
		<h2 class="text-2xl font-black">Edit Tugas</h2>
	</div>

	<Card>
		{#if loading}
			<p class="font-bold text-secondary text-center py-4">Memuat data tugas...</p>
		{:else if errorMsg && !title}
			<div class="text-center py-4">
				<p class="font-bold text-error">{errorMsg}</p>
			</div>
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

				<div class="mt-4 flex justify-end items-center">
					<Button
						type="button"
						variant="primary"
						disabled={submitting || selectedClassIds.length === 0}
						onclick={() => handleSubmit()}
					>
						<span class="material-symbols-outlined text-sm">save</span>
						{submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
					</Button>
				</div>
			</form>
		{/if}
	</Card>
</div>
