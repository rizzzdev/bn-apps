<script lang="ts">
	import { Button, Icon, Checkbox, Badge, ActionButton } from '$lib/components/atoms';
	import { Pagination, SearchBar, Modal, FormField } from '$lib/components/molecules';
	import {
		ConfirmationModal,
		ExcelPreviewTable,
		ImportResultTable
	} from '$lib/components/organisms';
	import {
		Table,
		TableHead,
		TableBody,
		TableRow,
		TableHeadCell,
		TableCell
	} from '$lib/components/organisms/table';
	import { toast } from '$lib/stores/toast.svelte';
	import { apiClient } from '$lib/utils/api';
	import * as XLSX from 'xlsx';
	import { Tabs } from '$lib/components/molecules';

	let { isCreateOpen = $bindable(false), handleExport = $bindable() } = $props<{
		isCreateOpen?: boolean;
		handleExport?: () => void;
	}>();

	let isEditOpen = $state(false);
	let isDeleteOpen = $state(false);
	let selectedMajor = $state<import('$lib/types').Major | null>(null);
	let selectedIds = $state<string[]>([]);
	let isBulkDeleteOpen = $state(false);

	let formData = $state({
		code: '',
		name: ''
	});

	let activeTabId = $state('single');
	let uploadedFile = $state<File | null>(null);
	let isUploading = $state(false);
	let isSaving = $state(false);
	let importStep = $state<'upload' | 'preview' | 'result'>('upload');
	let importResult = $state<{
		successCount: number;
		successRows: Record<string, unknown>[];
		failedRows: Record<string, unknown>[];
	} | null>(null);

	const previewColumns = [
		{ key: 'Kode Jurusan', label: 'Kode Jurusan' },
		{ key: 'Nama Jurusan', label: 'Nama Jurusan' }
	];

	const resultSuccessColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'code', label: 'Kode Jurusan' },
		{ key: 'name', label: 'Nama Jurusan' }
	];

	const resultFailedColumns = [
		{ key: 'code', label: 'Kode Jurusan' },
		{ key: 'name', label: 'Nama Jurusan' },
		{ key: 'reason', label: 'Alasan Gagal' }
	];

	$effect(() => {
		if (isCreateOpen) {
			formData = { code: '', name: '' };
			activeTabId = 'single';
			uploadedFile = null;
			importStep = 'upload';
			importResult = null;
		}
	});

	async function downloadTemplate() {
		try {
			const res = await apiClient('/majors/template');
			if (!res.ok) throw new Error('Gagal mengunduh template');
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'template-jurusan.xlsx';
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
		} catch {
			toast.error('Gagal mengunduh template');
		}
	}

	async function handleUpload() {
		if (!uploadedFile) {
			toast.error('Pilih file terlebih dahulu');
			return;
		}

		isUploading = true;
		try {
			const uploadData = new FormData();
			uploadData.append('file', uploadedFile);

			const res = await apiClient('/majors/batch/excel', {
				method: 'POST',
				body: uploadData
			});

			const result = await res.json();
			if (res.ok && !result.error) {
				importResult = result.data;
				importStep = 'result';
				toast.success(
					`Berhasil: ${result.data.successCount} data, Gagal: ${result.data.failedRows.length} data`
				);
				await fetchMajors(currentPage, limit);
			} else {
				toast.error(result.message || 'Gagal mengimpor data');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi saat mengunggah');
		} finally {
			isUploading = false;
		}
	}

	function handlePreviewConfirm() {
		importStep = 'preview';
	}

	function handleConfirmUpload() {
		handleUpload();
	}

	function handleCancelImport() {
		importStep = 'upload';
		importResult = null;
		uploadedFile = null;
	}

	const exportData = () => {
		if (filteredMajors.length === 0) {
			toast.error('Tidak ada data untuk diekspor');
			return;
		}

		const headers = ['No', 'Kode Jurusan', 'Nama Jurusan', 'Jumlah Kelas'];
		const rows = filteredMajors.map((item, i) => {
			return [i + 1, item.code, item.name, item.classCount];
		});

		const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Data');
		XLSX.writeFile(wb, `data_major_${new Date().toISOString().slice(0, 10)}.xlsx`);

		toast.success('Data berhasil diekspor');
	};

	$effect(() => {
		if (handleExport !== exportData) {
			handleExport = exportData;
		}
	});
	function openEdit(major: import('$lib/types').Major) {
		selectedMajor = major;
		formData = {
			code: major.code,
			name: major.name
		};
		isEditOpen = true;
	}

	function openDelete(major: import('$lib/types').Major) {
		selectedMajor = major;
		isDeleteOpen = true;
	}

	async function handleSave() {
		isSaving = true;
		try {
			const payload: Record<string, unknown> = { ...formData };

			if (isCreateOpen) {
				const res = await apiClient('/majors', { method: 'POST', body: JSON.stringify(payload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Jurusan berhasil ditambahkan!');
					isCreateOpen = false;
					await fetchMajors(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal menambahkan jurusan');
				}
			} else if (isEditOpen && selectedMajor) {
				const res = await apiClient(`/majors/${selectedMajor.id}`, {
					method: 'PUT',
					body: JSON.stringify(payload)
				});
				const result = await res.json();
				if (!result.error) {
					toast.success('Data jurusan berhasil diperbarui!');
					isEditOpen = false;
					await fetchMajors(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal memperbarui jurusan');
				}
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		try {
			if (!selectedMajor) return;
			const res = await apiClient(`/majors/${selectedMajor.id}`, { method: 'DELETE' });
			const result = await res.json();
			if (!result.error) {
				toast.success('Data jurusan berhasil dihapus!');
				isDeleteOpen = false;
				await fetchMajors(currentPage, limit);
			} else {
				toast.error(result.message || 'Gagal menghapus jurusan');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkDelete() {
		try {
			const res = await apiClient('/majors/batch/delete', {
				method: 'POST',
				body: JSON.stringify({ ids: Array.from(selectedIds) })
			});
			const result = await res.json().catch(() => ({}));
			if (res.ok && !result.error) {
				toast.success(`${selectedIds.length} Data jurusan berhasil dihapus!`);
				isBulkDeleteOpen = false;
				selectedIds = [];
				await fetchMajors(currentPage, limit);
			} else {
				toast.error(result.message || 'Gagal menghapus data masal');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	function toggleAll(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		selectedIds = checked ? filteredMajors.map((m) => m.id) : [];
	}

	let majors = $state<import('$lib/types').Major[]>([]);
	let isLoading = $state(true);
	let currentPage = $state(1);
	let limit = $state(10);
	let totalPages = $state(1);
	let totalItems = $state(0);

	const fetchMajors = async (page: number, limitPerPage: number) => {
		isLoading = true;
		try {
			const res = await apiClient(
				`/majors?page=${page}&limit=${limitPerPage}&includeCurrentStudent=true`
			);
			const result = await res.json();
			if (!result.error && result.data) {
				majors = Array.isArray(result.data) ? result.data : [];
				totalPages = result.pagination?.totalPage || 1;
				totalItems = result.pagination?.totalData || 0;
			} else {
				toast.error(result.message || 'Gagal memuat data jurusan');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isLoading = false;
		}
	};

	$effect(() => {
		fetchMajors(currentPage, limit);
	});

	let searchQuery = $state('');

	let filteredMajors = $derived(
		majors.filter((m) => {
			return (
				m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.code.toLowerCase().includes(searchQuery.toLowerCase())
			);
		})
	);
</script>

<div class="mb-md flex flex-col md:flex-row gap-sm items-center justify-between">
	<div class="flex flex-col md:flex-row gap-sm w-full md:w-auto h-auto">
		<SearchBar
			bind:value={searchQuery}
			placeholder="Cari kode atau nama jurusan..."
			class="w-full md:w-80"
		/>
	</div>
</div>

{#if selectedIds.length > 0}
	<div
		class="mb-md p-sm bg-primary-container border-3 border-on-background rounded-lg flex items-center justify-between shadow-neo-sm"
	>
		<span class="font-body-bold text-body-bold">{selectedIds.length} Jurusan dipilih</span>
		<Button variant="error" class="h-auto py-1.5 px-3" onclick={() => (isBulkDeleteOpen = true)}
			>Hapus Masal</Button
		>
	</div>
{/if}

<Table class="mb-0">
	<TableHead>
		<TableRow header>
			<TableHeadCell width="w-12" align="center">
				<Checkbox
					checked={selectedIds.length === filteredMajors.length && filteredMajors.length > 0}
					onchange={toggleAll}
				/>
			</TableHeadCell>
			<TableHeadCell>Kode Jurusan</TableHeadCell>
			<TableHeadCell>Nama Jurusan</TableHeadCell>
			<TableHeadCell align="center">Jumlah Kelas</TableHeadCell>
			<TableHeadCell align="center">Jumlah Murid</TableHeadCell>
			<TableHeadCell width="w-32" align="center">Aksi</TableHeadCell>
		</TableRow>
	</TableHead>
	<TableBody>
		{#if isLoading}
			<TableRow>
				<TableCell colspan={6} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Memuat data jurusan...</span>
				</TableCell>
			</TableRow>
		{:else if filteredMajors.length === 0}
			<TableRow>
				<TableCell colspan={6} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Belum ada data jurusan.</span>
				</TableCell>
			</TableRow>
		{:else}
			{#each filteredMajors as major, i (major.id)}
				<TableRow striped={i % 2 !== 0}>
					<TableCell align="center">
						<Checkbox bind:group={selectedIds} value={major.id} />
					</TableCell>
					<TableCell><Badge color="#FEF08A" class="text-xs">{major.code}</Badge></TableCell>
					<TableCell>{major.name}</TableCell>
					<TableCell align="center">
						<Badge color="#DBEAFE" class="text-xs"
							>{major._count?.classes || major.classCount || 0}</Badge
						>
					</TableCell>
					<TableCell align="center">
						<Badge color="#F3E8FF" class="text-xs"
							>{(major._count as Record<string, unknown>)?.currentStudents || 0}</Badge
						>
					</TableCell>
					<TableCell align="center">
						<div class="flex justify-center gap-xs">
							<ActionButton icon="edit" title="Edit" onclick={() => openEdit(major)} />
							<ActionButton
								icon="delete"
								title="Hapus"
								variant="danger"
								onclick={() => openDelete(major)}
							/>
						</div>
					</TableCell>
				</TableRow>
			{/each}
		{/if}
	</TableBody>
</Table>

<Pagination
	{currentPage}
	{totalPages}
	{totalItems}
	itemsPerPage={limit}
	onPageChange={(page) => (currentPage = page)}
/>

<Modal bind:isOpen={isCreateOpen} title="Tambah Jurusan">
	<Tabs
		tabs={[
			{ id: 'single', label: 'Single Create', icon: 'add' },
			{ id: 'bulk', label: 'Import Excel', icon: 'upload' }
		]}
		bind:activeTab={activeTabId}
		class="mb-md"
	/>

	{#if activeTabId === 'single'}
		<div class="flex flex-col gap-sm">
			<FormField
				id="code-create"
				label="Kode Jurusan"
				bind:value={formData.code}
				placeholder="Contoh: RPL"
			/>
			<FormField
				id="name-create"
				label="Nama Jurusan"
				bind:value={formData.name}
				placeholder="Contoh: Rekayasa Perangkat Lunak"
			/>
		</div>
	{:else}
		{#if importStep === 'upload'}
			<div class="flex flex-col gap-sm">
				<div class="flex justify-between items-center">
					<p class="font-body-base text-body-base text-on-surface-variant">
						Unggah file Excel (.xlsx) yang berisi data jurusan.
					</p>
					<Button variant="secondary" class="py-1 px-3 text-sm h-8" onclick={downloadTemplate}>
						<Icon name="download" class="text-sm mr-1" fill={0} /> Template
					</Button>
				</div>
				<FormField id="excel-bulk-major" label="File Excel" type="excel" bind:file={uploadedFile} />
				{#if uploadedFile}
					<Button variant="info" class="w-full" onclick={handlePreviewConfirm}>
						<Icon name="visibility" class="text-xs mr-1" fill={0} /> Lihat Pratinjau
					</Button>
				{/if}
			</div>
		{:else if importStep === 'preview'}
			<ExcelPreviewTable
				file={uploadedFile}
				columns={previewColumns}
				isProcessing={isUploading}
				onCancel={handleCancelImport}
				onConfirm={handleConfirmUpload}
			/>
		{:else if importStep === 'result'}
			<ImportResultTable
				result={importResult}
				successColumns={resultSuccessColumns}
				failedColumns={resultFailedColumns}
			/>
		{/if}
	{/if}

	{#snippet footer()}
		<Button
			variant="secondary"
			onclick={() => (isCreateOpen = false)}
			class="bg-surface text-on-surface hover:bg-surface-variant w-auto"
			disabled={isUploading || isSaving}>Batal</Button
		>
		{#if activeTabId === 'single'}
			<Button variant="info" disabled={isSaving} onclick={handleSave}
				>{isSaving ? 'Menyimpan...' : 'Simpan'}</Button
			>
		{:else if importStep === 'result'}
			<Button variant="info" onclick={() => (isCreateOpen = false)}>Selesai</Button>
		{/if}
	{/snippet}
</Modal>

<Modal bind:isOpen={isEditOpen} title="Edit Jurusan">
	<div class="flex flex-col gap-sm">
		<FormField
			id="code-edit"
			label="Kode Jurusan"
			bind:value={formData.code}
			placeholder="Contoh: RPL"
		/>
		<FormField
			id="name-edit"
			label="Nama Jurusan"
			bind:value={formData.name}
			placeholder="Contoh: Rekayasa Perangkat Lunak"
		/>
	</div>
	{#snippet footer()}
		<Button
			variant="secondary"
			onclick={() => (isEditOpen = false)}
			class="bg-surface text-on-surface hover:bg-surface-variant w-auto"
			disabled={isSaving}>Batal</Button
		>
		<Button variant="info" disabled={isSaving} onclick={handleSave}
			>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button
		>
	{/snippet}
</Modal>

<ConfirmationModal
	bind:isOpen={isDeleteOpen}
	type="danger"
	title="Hapus Jurusan"
	message={`Apakah Anda yakin ingin menghapus jurusan ${selectedMajor?.name}? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus"
	cancelText="Batal"
	onConfirm={handleDelete}
/>

<ConfirmationModal
	bind:isOpen={isBulkDeleteOpen}
	type="danger"
	title="Hapus Masal Jurusan"
	message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} data jurusan yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus Semua"
	cancelText="Batal"
	onConfirm={handleBulkDelete}
/>
