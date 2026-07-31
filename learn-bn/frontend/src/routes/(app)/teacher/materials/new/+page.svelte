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
	let content = $state('');
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

	$effect(() => {
		async function load() {
			loadingClasses = true;
			try {
				classes = await lmsStore.getTeacherClasses();
				const urlClassId = $page.url.searchParams.get('classId');
				if (urlClassId && classes.some((c) => c.id === urlClassId)) {
					selectedClassIds = [urlClassId];
				} else if (classes.length > 0 && selectedClassIds.length === 0) {
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
			errorMsg = 'Silakan pilih minimal satu kelas target';
			return;
		}
		if (title.trim().length < 3) {
			errorMsg = 'Judul materi minimal 3 karakter';
			return;
		}
		if (!content || content.trim() === '' || content === '<p></p>') {
			errorMsg = 'Konten materi tidak boleh kosong';
			return;
		}

		submitting = true;
		errorMsg = '';
		try {
			await lmsStore.createMaterial({
				title: title.trim(),
				content,
				status: finalStatus,
				classIds: selectedClassIds,
				attachments: attachments.map((a) => ({ fileUrl: a.url, fileName: a.name })),
			});

			if (selectedClassIds.length === 1) {
				goto(`/teacher/classes/${selectedClassIds[0]}/materials`);
			} else {
				goto('/teacher/materials');
			}
		} catch (err: any) {
			errorMsg = err.message || 'Gagal membuat materi';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Tambah Materi - Akademik-BN</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	<div class="mb-6 flex items-center gap-4">
		<Button variant="outline" onclick={() => goto('/teacher/materials')}>Kembali</Button>
		<h2 class="text-2xl font-black">Tambah Materi Baru</h2>
	</div>

	<Card>
		{#if loadingClasses}
			<p class="font-bold text-secondary text-center py-4">Memuat kelas...</p>
		{:else}
			<form onsubmit={(e) => e.preventDefault()} class="flex flex-col gap-5">
				<Input label="Judul Materi" bind:value={title} placeholder="Masukkan judul materi..." required />

				<div class="flex flex-col gap-1">
					<span class="font-label-bold text-sm">Konten Materi <span class="text-error">*</span></span>
					<RichTextEditor bind:value={content} placeholder="Tulis konten materi..." />
				</div>

				<div class="flex flex-col gap-1">
					<span class="font-label-bold text-sm">Lampiran File</span>
					<FileUpload bind:files={attachments} multiple label="Upload Lampiran" />
				</div>

				<!-- Field Custom Dropdown: Pilih Kelas Target & Status Publikasi (diletakkan tepat di atas tombol simpan) -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-on-surface/20 pt-4 mt-2">
					<CustomSelect
						label="Pilih Kelas Target"
						options={classOptions}
						bind:value={selectedClassIds}
						multiple={true}
						placeholder="Pilih kelas target..."
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

				{#if errorMsg}
					<div class="bg-error/10 border-2 border-error p-3 neo-border text-error text-sm font-label-bold flex items-center gap-2">
						<span class="material-symbols-outlined text-base">error</span>
						<span>{errorMsg}</span>
					</div>
				{/if}

				<!-- Tombol Simpan -->
				<div class="mt-4 flex justify-end items-center">
					<Button
						type="button"
						variant="primary"
						disabled={submitting || selectedClassIds.length === 0}
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
