<script lang="ts">
	import { Button, Icon } from '$lib/components/atoms';
	import Modal from './modal.svelte';
	import TooltipIconButton from './tooltip-icon-button.svelte';
	import { uploadExcel, downloadExcel } from '$lib/services/base';
	import { toast } from '$lib/stores/toast.svelte';

	interface ExcelFailedRow {
		[key: string]: unknown;
		reason: string;
	}

	interface ExcelImportResult {
		successCount: number;
		failedRows: ExcelFailedRow[];
	}

	let {
		templateEndpoint,
		templateFilename,
		uploadEndpoint,
		serviceLabel = 'Data',
		onSuccess
	} = $props<{
		templateEndpoint: string;
		templateFilename: string;
		uploadEndpoint: string;
		serviceLabel?: string;
		onSuccess?: () => void | Promise<void>;
	}>();

	let isOpen = $state(false);
	let isDownloading = $state(false);
	let isUploading = $state(false);
	let selectedFile = $state<File | null>(null);
	let result = $state<ExcelImportResult | null>(null);
	let isDragging = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	let failedCount = $derived(result?.failedRows.length ?? 0);

	function open() {
		selectedFile = null;
		result = null;
		isOpen = true;
	}

	async function handleDownloadTemplate() {
		isDownloading = true;
		try {
			await downloadExcel(templateEndpoint, templateFilename);
			toast.success('Template Excel berhasil diunduh');
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Gagal mengunduh template';
			toast.error(msg);
		} finally {
			isDownloading = false;
		}
	}

	function handleFileSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			selectedFile = input.files[0];
			result = null;
		}
	}

	function resetFileInput() {
		if (fileInput) fileInput.value = '';
	}

	function handleDrop(e: DragEvent) {
		isDragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) {
			selectedFile = file;
			result = null;
		}
	}

	async function handleUpload() {
		if (!selectedFile) {
			toast.error('Pilih file Excel terlebih dahulu');
			return;
		}
		isUploading = true;
		try {
			const res = await uploadExcel<ExcelImportResult>(uploadEndpoint, selectedFile);
			const data = res.data;
			if (!data) {
				toast.error(res.message || 'Tidak ada respons dari server');
				return;
			}
			result = data;
			toast.success(
				data.successCount > 0
					? `${data.successCount} baris berhasil diimport`
					: 'Import selesai, tidak ada baris yang berhasil'
			);
			// Reset input agar memilih file yang sama lagi tetap memicu `change`.
			resetFileInput();
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Gagal mengupload file';
			toast.error(msg);
		} finally {
			isUploading = false;
		}

		// Refresh data halaman — di luar try/catch upload agar kegagalan refresh
		// tidak dianggap sebagai kegagalan upload.
		try {
			await onSuccess?.();
		} catch {
			toast.error('Data berhasil diimport tetapi gagal memuat ulang halaman');
		}
	}
</script>

<TooltipIconButton
	icon="file_upload"
	tooltip={`Import ${serviceLabel} dari Excel`}
	onclick={open}
	variant="primary"
/>

<Modal bind:isOpen title={`Import ${serviceLabel} dari Excel`}>
	<div class="flex flex-col gap-4">
		<!-- Step 1: Download Template -->
		<div class="neo-border bg-surface-container-low p-4 flex flex-col gap-2">
			<span class="font-label-caps text-label-caps uppercase text-on-surface-variant">
				Langkah 1 — Unduh Template
			</span>
			<p class="text-xs text-on-surface font-data-mono">
				Unduh template, isi baris data sesuai kolom yang tersedia (baris contoh hanya panduan), lalu
				upload.
			</p>
			<div class="flex items-center gap-2">
				<Button
					variant="secondary"
					class="!px-4 !h-9 !text-xs"
					onclick={handleDownloadTemplate}
					disabled={isDownloading}
				>
					<Icon name="file_download" size="16px" class="shrink-0" />
					{isDownloading ? 'Mengunduh...' : 'Download Template'}
				</Button>
			</div>
			<span class="text-[10px] text-on-surface-variant uppercase">
				Baris contoh pada template hanya panduan — hapus atau ganti sebelum upload.
			</span>
		</div>

		<!-- Step 2: Upload File -->
		<div class="flex flex-col gap-2">
			<span class="font-label-caps text-label-caps uppercase text-on-surface-variant">
				Langkah 2 — Upload File Excel
			</span>
			<label
				class="neo-border border-dashed p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center
				{isDragging
					? 'bg-secondary-container border-secondary neo-shadow-sm'
					: 'bg-surface hover:bg-surface-container-low'}"
				ondragover={(e) => {
					e.preventDefault();
					isDragging = true;
				}}
				ondragleave={() => (isDragging = false)}
				ondrop={(e) => {
					e.preventDefault();
					handleDrop(e);
				}}
			>
				<input
					type="file"
					accept=".xlsx,.xls"
					class="hidden"
					onchange={handleFileSelected}
					bind:this={fileInput}
				/>
				<Icon name="file_upload" size="28px" class="text-on-surface-variant" />
				{#if selectedFile}
					<span class="font-data-mono text-xs font-bold text-on-surface break-all"
						>{selectedFile.name}</span
					>
					<span class="text-[10px] text-on-surface-variant uppercase"
						>Klik / drop untuk mengganti file</span
					>
				{:else}
					<span class="font-label-caps text-label-caps uppercase text-on-surface font-bold">
						Klik atau seret file .xlsx di sini
					</span>
					<span class="text-[10px] text-on-surface-variant uppercase">Maksimal 5 MB</span>
				{/if}
			</label>
		</div>

		{#if result}
			<!-- Result Summary -->
			<div class="flex flex-col gap-3 neo-border-t pt-4">
				<div class="grid grid-cols-2 gap-3">
					<div
						class="neo-border bg-secondary-container text-on-secondary-container p-3 text-center"
					>
						<div class="text-2xl font-black font-data-mono">{result.successCount}</div>
						<div class="text-[10px] uppercase font-bold font-data-mono">Berhasil</div>
					</div>
					<div class="neo-border bg-error-container text-on-error-container p-3 text-center">
						<div class="text-2xl font-black font-data-mono">{failedCount}</div>
						<div class="text-[10px] uppercase font-bold font-data-mono">Gagal</div>
					</div>
				</div>

				{#if failedCount > 0}
					<div class="neo-border overflow-hidden">
						<div
							class="bg-error text-on-error px-3 py-2 font-label-caps text-label-caps uppercase flex items-center gap-2"
						>
							<Icon name="warning" size="14px" />
							<span>Baris Gagal ({failedCount})</span>
						</div>
						<div class="max-h-48 overflow-x-auto overflow-y-auto bg-surface">
							<table class="w-full min-w-[320px] text-left font-data-mono text-xs border-collapse">
								<thead>
									<tr
										class="neo-border-b bg-surface-container-high text-on-surface-variant uppercase text-[10px]"
									>
										<th class="p-2 border-r-2 border-on-surface w-8">#</th>
										<th class="p-2 border-r-2 border-on-surface">Data Baris</th>
										<th class="p-2">Alasan</th>
									</tr>
								</thead>
								<tbody>
									{#each result.failedRows as row, i}
										<tr class="neo-border-b last:border-b-0">
											<td class="p-2 border-r-2 border-on-surface text-center">{i + 1}</td>
											<td
												class="p-2 border-r-2 border-on-surface text-on-surface-variant max-w-[110px] sm:max-w-[180px] truncate"
											>
												{Object.entries(row)
													.filter(([k]) => k !== 'reason')
													.map(([k, v]) => `${k}: ${String(v ?? '')}`)
													.join(' · ')}
											</td>
											<td class="p-2 text-error font-bold">{row.reason}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isOpen = false)}>Tutup</Button>
		<Button variant="primary" onclick={handleUpload} disabled={isUploading || !selectedFile}>
			{#if isUploading}
				<div
					class="animate-spin rounded-full h-4 w-4 border-2 border-on-primary border-t-transparent shrink-0"
				></div>
				<span>Mengupload...</span>
			{:else}
				<Icon name="upload" size="16px" class="shrink-0" />
				<span>Upload & Import</span>
			{/if}
		</Button>
	{/snippet}
</Modal>
