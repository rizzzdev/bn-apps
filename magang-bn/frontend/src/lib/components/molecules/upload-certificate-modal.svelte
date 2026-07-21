<script lang="ts">
	import { Icon, Button, ActionButton } from '$lib/components/atoms';

	let {
		show = $bindable(false),
		studentName = '',
		onsubmit = async (_file: File) => {},
	} = $props<{
		show?: boolean;
		studentName?: string;
		onsubmit?: (file: File) => Promise<void>;
	}>();

	let fileInput: HTMLInputElement | undefined = $state();
	let selectedFile = $state<File | null>(null);
	let uploading = $state(false);

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			selectedFile = target.files[0];
		}
	}

	function removeSelectedFile() {
		selectedFile = null;
		if (fileInput) fileInput.value = '';
	}

	async function handleUpload() {
		if (!selectedFile) return;
		uploading = true;
		try {
			await onsubmit(selectedFile);
			show = false;
		} finally {
			uploading = false;
		}
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/50 backdrop-blur-sm">
		<div class="bg-surface border-4 border-on-background shadow-[8px_8px_0px_0px_#0f172a] w-full max-w-md animate-scale-in">
			<div class="border-b-4 border-on-background p-4 flex justify-between items-center bg-secondary text-on-background">
				<h3 class="font-headline font-black text-xl uppercase text-white">Upload Sertifikat</h3>
				<button onclick={() => show = false} class="hover:bg-on-background/20 p-1 rounded transition-colors text-white">
					<Icon name="close" class="text-2xl" />
				</button>
			</div>
			<div class="p-6">
				<p class="mb-4 text-sm font-mono text-secondary">
					Silakan unggah sertifikat kelulusan dalam format PDF atau Gambar (maksimal 5MB)
					untuk murid <strong>{studentName}</strong>.
				</p>
				<div class="mb-6">
					{#if selectedFile}
						<div class="flex items-center justify-between border-4 border-on-background p-3 mb-2 bg-slate-50">
							<div class="flex items-center gap-2 overflow-hidden">
								<Icon name="insert_drive_file" class="text-primary" />
								<div class="flex flex-col overflow-hidden">
									<span class="font-bold text-sm truncate">{selectedFile.name}</span>
									<span class="font-mono text-xs text-secondary">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
								</div>
							</div>
							<ActionButton variant="error" icon="delete" label="Hapus File" onclick={removeSelectedFile} />
						</div>
					{:else}
						<label class="border-4 border-dashed border-on-background p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex flex-col items-center">
							<Icon name="add_circle" class="text-2xl text-secondary mb-1" />
							<span class="font-bold text-sm">Pilih Sertifikat...</span>
							<span class="font-mono text-[10px] text-secondary mt-1">Maks ukuran file: 5MB</span>
							<input type="file" class="hidden" accept=".pdf,image/*" bind:this={fileInput} onchange={handleFileSelect} />
						</label>
					{/if}
				</div>
				<div class="flex gap-4">
					<Button variant="secondary" class="flex-1" onclick={() => show = false}>Batal</Button>
					<Button variant="primary" class="flex-1" onclick={handleUpload} disabled={uploading || !selectedFile}>
						{uploading ? 'Mengunggah...' : 'Upload'}
					</Button>
				</div>
			</div>
		</div>
	</div>
{/if}
