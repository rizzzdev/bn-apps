<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
	import { apiClient } from '$lib/utils/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { Avatar, Button, Icon } from '$lib/components/atoms';

	type Mode = 'idle' | 'preview' | 'uploading';

	let {
		pictureUrl,
		fullname,
		entityType,
		entityId,
		onUpdate
	} = $props<{
		pictureUrl: string | null | undefined;
		fullname: string;
		entityType: 'student' | 'teacher';
		entityId: string;
		onUpdate: () => void;
	}>();

	let mode = $state<Mode>('idle');
	let fileInput = $state<HTMLInputElement | null>(null);
	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);

	const getInitials = () => {
		const words = (fullname || '').trim().split(/\s+/);
		if (words.length >= 2) {
			return (words[0][0] + words[1][0]).toUpperCase();
		}
		return (fullname || '?')[0].toUpperCase();
	};

	const getImageSrc = () => {
		if (previewUrl) return previewUrl;
		if (pictureUrl) return `${PUBLIC_API_URL}/attachments/file/${pictureUrl}`;
		return null;
	};

	const handleFileSelect = (e: Event) => {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			toast.error('Hanya file gambar yang diizinkan');
			return;
		}

		// Validate file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			toast.error('Ukuran file maksimal 10MB');
			return;
		}

		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
		mode = 'preview';
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		mode = 'uploading';
		try {
			const formData = new FormData();
			formData.append('file', selectedFile);

			const res = await apiClient(`/${entityType}s/${entityId}/picture`, {
				method: 'PUT',
				body: formData
			});

			const result = await res.json();
			if (!result.error) {
				toast.success('Foto profil berhasil diunggah');
				resetPreview();
				onUpdate();
			} else {
				toast.error(result.message || 'Gagal mengunggah foto');
				mode = 'preview';
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
			mode = 'preview';
		}
	};

	const handleDelete = async () => {
		if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) return;

		try {
			const res = await apiClient(`/${entityType}s/${entityId}/picture`, {
				method: 'DELETE'
			});

			const result = await res.json();
			if (!result.error) {
				toast.success('Foto profil berhasil dihapus');
				onUpdate();
			} else {
				toast.error(result.message || 'Gagal menghapus foto');
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		}
	};

	const resetPreview = () => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = null;
		selectedFile = null;
		mode = 'idle';
		if (fileInput) fileInput.value = '';
	};

	const cancelPreview = () => {
		resetPreview();
	};

	const triggerFilePicker = () => {
		fileInput?.click();
	};
</script>

<div class="flex flex-col items-center gap-sm">
	<!-- Hidden file input -->
	<input
		type="file"
		accept="image/*"
		class="hidden"
		bind:this={fileInput}
		onchange={handleFileSelect}
	/>

	<!-- Avatar / Placeholder area -->
	<div class="relative group">
		{#if mode === 'uploading'}
			<div class="h-28 w-28 border-3 border-on-background rounded-xl shadow-neo flex items-center justify-center bg-on-primary">
				<Icon name="sync" class="text-3xl text-on-surface-variant animate-spin" />
			</div>
		{:else if getImageSrc()}
			<Avatar
				src={getImageSrc()!}
				alt={fullname}
				size="h-28 w-28"
				rounded="rounded-xl"
			/>
		{:else}
			<div class="h-28 w-28 border-3 border-on-background rounded-xl shadow-neo flex items-center justify-center bg-secondary">
				<span class="text-3xl font-headline-md text-on-secondary font-bold tracking-tighter">
					{getInitials()}
				</span>
			</div>
		{/if}

		<!-- Hover overlay for idle/preview mode -->
		{#if mode !== 'preview'}
			<button type="button"
				class="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-xs cursor-pointer border-none"
				onclick={triggerFilePicker}
			>
				<Icon name="photo_camera" class="text-2xl text-white" fill={1} />
			</button>

			<!-- Delete button (only when picture exists) -->
			{#if pictureUrl}
				<button
					class="absolute -top-2 -right-2 h-7 w-7 bg-error text-on-error border-3 border-on-background rounded-full flex items-center justify-center shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-neo-xs transition-all cursor-pointer"
					onclick={handleDelete}
					title="Hapus foto"
				>
					<Icon name="close" class="text-sm" fill={1} />
				</button>
			{/if}
		{/if}
	</div>

	<!-- Preview mode: Simpan / Batal buttons -->
	{#if mode === 'preview'}
		<div class="flex gap-xs">
			<Button variant="primary" onclick={handleUpload}>
				Simpan
			</Button>
			<Button variant="secondary" onclick={cancelPreview}>
				Batal
			</Button>
		</div>
	{:else if !pictureUrl}
		<!-- Upload button when no picture -->
		<button
			class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide cursor-pointer hover:text-on-surface transition-colors"
			onclick={triggerFilePicker}
		>
			Tambah Foto
		</button>
	{/if}
</div>
