<script lang="ts">
	import { api } from '$lib/api';

	let {
		accept = '*',
		multiple = false,
		label = 'Upload File',
		files = $bindable([] as { url: string; name: string }[]),
	}: {
		accept?: string;
		multiple?: boolean;
		label?: string;
		files?: { url: string; name: string }[];
	} = $props();

	let uploading = $state(false);
	let error = $state('');

	async function handleUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length) return;

		uploading = true;
		error = '';
		const uploaded: { url: string; name: string }[] = [];

		for (const file of input.files) {
			const formData = new FormData();
			formData.append('file', file);

			try {
				const res = await api.post<{ error: boolean; statusCode: number; message: string; data: { id: string; url: string; filename: string } | null }>('/attachments/upload', formData, true);
				if (res.data) {
					uploaded.push({ url: res.data.url, name: res.data.filename });
				}
			} catch (err: any) {
				error = `Gagal upload ${file.name}: ${err.message || 'Unknown error'}`;
			}
		}

		if (multiple) {
			files = [...files, ...uploaded];
		} else {
			files = uploaded.slice(0, 1);
		}
		uploading = false;
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}
</script>

<div class="file-upload">
	<label class="upload-btn neo-border bg-surface font-label-bold cursor-pointer inline-flex items-center gap-2 px-4 py-2">
		<span class="material-symbols-outlined">upload</span>
		{label}
		<input type="file" {accept} {multiple} onchange={handleUpload} class="hidden" />
	</label>

	{#if uploading}
		<p class="text-secondary mt-2">Mengupload...</p>
	{/if}

	{#if error}
		<p class="text-error mt-2 text-sm">{error}</p>
	{/if}

	{#if files.length > 0}
		<ul class="mt-3 space-y-1">
			{#each files as file, i}
				<li class="flex items-center gap-2 text-sm font-label-bold">
					<span class="material-symbols-outlined text-sm">attach_file</span>
					<span>{file.name}</span>
					<button type="button" onclick={() => removeFile(i)} class="text-error hover:text-error/80 ml-auto">
						<span class="material-symbols-outlined text-sm">close</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
