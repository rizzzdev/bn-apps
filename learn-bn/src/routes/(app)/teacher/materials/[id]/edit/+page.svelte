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

	let materialId = $derived($page.params.id as string);

	let title = $state('');
	let content = $state('');
	let status = $state<'Draft' | 'Published'>('Draft');
	let selectedClassIds = $state<string[]>([]);
	let attachments = $state<{ url: string; name: string }[]>([]);
	let classes: Awaited<ReturnType<typeof lmsStore.getTeacherClasses>> = $state([]);
	let loading = $state(true);
	let submitting = $state(false);
	let errorMsg = $state('');
	let notFound = $state(false);

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
			loading = true;
			try {
				const [material, teacherClasses] = await Promise.all([
					lmsStore.getMaterial(materialId),
					lmsStore.getTeacherClasses(),
				]);
				if (!material) {
					notFound = true;
					return;
				}
				classes = teacherClasses;
				title = material.title;
				content = material.content;
				status = material.status || 'Draft';
				attachments = (material.attachments || []).map((a) => ({ url: a.fileUrl, name: a.fileName }));
				if (material.classes && material.classes.length > 0) {
					selectedClassIds = material.classes.map((c) => c.classId);
				} else if (material.classId) {
					selectedClassIds = [material.classId];
				}
			} catch (err: any) {
				errorMsg = err.message || 'Gagal memuat materi';
			} finally {
				loading = false;
			}
		}
		load();
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
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
			await lmsStore.updateMaterial(materialId, {
				title: title.trim(),
				content,
				status,
				classIds: selectedClassIds,
				attachments: attachments.map((a) => ({ fileUrl: a.url, fileName: a.name })),
			});
			goto(`/teacher/materials/${materialId}`);
		} catch (err: any) {
			errorMsg = err.message || 'Gagal menyimpan materi';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Materi - Akademik-BN</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
	{#if loading}
		<div class="bg-surface-container-lowest neo-border p-12 text-center">
			<span class="material-symbols-outlined text-4xl text-secondary mb-2">hourglass</span>
			<p class="font-bold text-secondary">Memuat materi...</p>
		</div>
	{:else if notFound}
		<div class="bg-surface-container-lowest neo-border p-12 text-center">
			<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
			<h2 class="font-headline-md text-2xl font-black mb-2">Materi Tidak Ditemukan</h2>
		</div>
	{:else}
		<div class="mb-6 flex items-center gap-4">
			<Button variant="outline" onclick={() => goto(`/teacher/materials/${materialId}`)}>Kembali</Button>
			<h2 class="text-2xl font-black">Edit Materi</h2>
		</div>

		<Card>
			<form onsubmit={handleSubmit} class="flex flex-col gap-5">
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

				<div class="mt-4 flex justify-end">
					<Button type="submit" variant="primary" disabled={submitting || selectedClassIds.length === 0}>
						<span class="material-symbols-outlined text-sm">save</span>
						{submitting ? 'Menyimpan...' : 'Simpan'}
					</Button>
				</div>
			</form>
		</Card>
	{/if}
</div>
