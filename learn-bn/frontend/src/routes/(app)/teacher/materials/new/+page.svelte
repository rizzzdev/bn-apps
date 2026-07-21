<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';

	let classId = $derived($page.params.id as string);

	let title = $state('');
	let content = $state('');
	let file: File | null = $state(null);

	function handleSubmit(e: Event) {
		e.preventDefault();
		lmsStore.addMaterial({
			classId,
			title,
			content,
			attachmentName: file ? file.name : undefined
		});
		goto(`/teacher/classes/${classId}`);
	}

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			file = target.files[0];
		}
	}
</script>

<div class="max-w-2xl mx-auto">
	<div class="mb-6 flex items-center gap-4">
		<Button variant="outline" onclick={() => goto(`/teacher/classes/${classId}`)}>Kembali</Button>
		<h2 class="text-2xl font-black">Tambah Materi Baru</h2>
	</div>

	<Card>
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<Input label="Judul Materi" bind:value={title} required />

			<div class="flex flex-col gap-1">
				<label class="font-bold text-sm flex flex-col gap-1">
					<span>Isi Materi</span>
					<textarea
						bind:value={content}
						class="font-normal border-3 border-on-background bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-primary focus:shadow-neo min-h-[150px]"
						required
					></textarea>
				</label>
			</div>

			<div class="flex flex-col gap-1 border-2 border-dashed border-on-background p-4 bg-gray-50">
				<label class="font-bold text-sm flex flex-col gap-2 cursor-pointer">
					<span>Lampiran File (Opsional)</span>
					<input type="file" onchange={handleFileChange} />
				</label>
				{#if file}
					<span class="text-xs font-bold mt-2 text-primary">File terpilih: {file.name}</span>
				{/if}
			</div>

			<div class="mt-4 flex justify-end">
				<Button type="submit" variant="primary">Simpan Materi</Button>
			</div>
		</form>
	</Card>
</div>
