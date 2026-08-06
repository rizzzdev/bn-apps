<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
	import { apiClient, getApiBaseUrl } from '$lib/utils/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { Button, Icon } from '$lib/components/atoms';

	/**
	 * pictureId binding:
	 *   - undefined → no change (default)
	 *   - null      → hapus foto
	 *   - string    → ID attachment baru (setelah upload)
	 */
	let {
		pictureId = $bindable<string | null | undefined>(),
		currentImageUrl = null,
		label = 'Foto Profil'
	} = $props<{
		pictureId?: string | null | undefined;
		currentImageUrl?: string | null;
		label?: string;
	}>();

	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let isDeleted = $state(false);
	let isUploading = $state(false);
	let mode = $state<'idle' | 'preview' | 'uploading'>('idle');
	let fileInput = $state<HTMLInputElement | null>(null);

	// Reset internal state when picture binding changes externally
	$effect(() => {
		if (pictureId === undefined && !selectedFile && !isDeleted) {
			// External reset
		}
	});

	function getCurrentSrc(): string | null {
		if (previewUrl) return previewUrl;
		if (currentImageUrl) return `${getApiBaseUrl()}/master/attachments/file/${currentImageUrl}`;
		return null;
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Hanya file gambar yang diizinkan');
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.error('Ukuran file maksimal 10MB');
			return;
		}

		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
		isDeleted = false;
		mode = 'preview';
		// Auto-upload immediately
		uploadFile(file);
	}

	async function uploadFile(file: File) {
		mode = 'uploading';
		isUploading = true;
		try {
			const fd = new FormData();
			fd.append('file', file);
			const res = await apiClient('/attachments', { method: 'POST', body: fd });
			const result = await res.json();
			if (!result.error && result.data) {
				pictureId = result.data.id;
				toast.success('Foto berhasil diupload');
			} else {
				toast.error(result.message || 'Gagal mengupload foto');
				resetState();
			}
		} catch {
			toast.error('Gagal mengupload foto');
			resetState();
		} finally {
			isUploading = false;
			if (mode === 'uploading') mode = 'idle';
		}
	}

	function handleDelete() {
		if (isDeleted) {
			// Undo delete
			isDeleted = false;
			pictureId = undefined;
		} else {
			isDeleted = true;
			pictureId = null;
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
				previewUrl = null;
			}
			selectedFile = null;
			mode = 'idle';
		}
	}

	function resetState() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		selectedFile = null;
		previewUrl = null;
		isDeleted = false;
		pictureId = undefined;
		mode = 'idle';
	}
</script>

<div
	class="flex flex-col items-center gap-sm py-sm px-md border-2 border-dashed border-on-background/30 rounded-xl bg-surface-container-highest/30"
>
	{#if label}
		<span class="font-label-md text-label-md text-on-surface-variant self-start">{label}</span>
	{/if}

	<!-- Preview / Current image -->
	{#if getCurrentSrc()}
		<img
			src={getCurrentSrc()!}
			alt="Preview foto"
			class="h-32 w-32 object-cover rounded-xl border-3 border-on-background shadow-neo-sm"
		/>
	{:else if isDeleted}
		<div
			class="h-32 w-32 border-3 border-error/50 rounded-xl flex items-center justify-center bg-error-container"
		>
			<Icon name="no_photography" class="text-4xl text-error" fill={1} />
		</div>
	{:else}
		<div
			class="h-32 w-32 border-3 border-on-background/30 rounded-xl flex items-center justify-center bg-surface-container-highest"
		>
			<Icon name="image" class="text-4xl text-on-surface-variant/50" fill={0} />
		</div>
	{/if}

	<!-- Hidden file input -->
	<input
		type="file"
		accept="image/*"
		class="hidden"
		bind:this={fileInput}
		onchange={handleFileSelect}
	/>

	<!-- Status text -->
	{#if mode === 'uploading' || isUploading}
		<span class="font-label-sm text-label-sm text-on-surface-variant">Mengupload foto...</span>
	{:else if isDeleted}
		<span class="font-label-sm text-label-sm text-warning">Foto akan dihapus saat menyimpan</span>
	{/if}

	<!-- Action buttons -->
	<div class="flex gap-xs flex-wrap justify-center">
		{#if !isDeleted}
			<Button
				variant="secondary"
				onclick={() => fileInput?.click()}
				disabled={mode === 'uploading'}
			>
				<Icon name="photo_camera" class="text-sm" fill={0} />
				{currentImageUrl || pictureId ? 'Ganti Foto' : 'Tambah Foto'}
			</Button>
		{/if}
		{#if currentImageUrl || pictureId}
			<Button variant="error" onclick={handleDelete} disabled={mode === 'uploading'}>
				<Icon name={isDeleted ? 'undo' : 'delete'} class="text-sm" fill={0} />
				{isDeleted ? 'Batalkan' : 'Hapus'}
			</Button>
		{/if}
	</div>
</div>
