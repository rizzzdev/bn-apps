<script lang="ts">
	import { Button, Icon, Checkbox, Badge, ActionButton } from '$lib/components/atoms';
	import {
		Pagination,
		SearchBar,
		Dropdown,
		Modal,
		FormField,
		SelectField,
		Tabs
	} from '$lib/components/molecules';
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
	import * as XLSX from 'xlsx';
	import { apiClient } from '$lib/utils/api';

	let { isCreateOpen = $bindable(false), handleExport = $bindable() } = $props<{
		isCreateOpen?: boolean;
		handleExport?: () => void;
	}>();

	let isEditOpen = $state(false);
	let isDeleteOpen = $state(false);
	let selectedClass = $state<import('$lib/types').Class | null>(null);
	let selectedIds = $state<string[]>([]);
	let isBulkDeleteOpen = $state(false);

	let formData = $state({
		name: '',
		majorId: ''
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
		{ key: 'Nama Kelas', label: 'Nama Kelas' },
		{ key: 'Kode Jurusan', label: 'Kode Jurusan' }
	];

	const resultSuccessColumns = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Nama Kelas' },
		{ key: 'majorId', label: 'Kode Jurusan' }
	];

	const resultFailedColumns = [
		{ key: 'name', label: 'Nama Kelas' },
		{ key: 'majorCode', label: 'Kode Jurusan' },
		{ key: 'reason', label: 'Alasan Gagal' }
	];

	$effect(() => {
		if (isCreateOpen) {
			formData = { name: '', majorId: '' };
			activeTabId = 'single';
			uploadedFile = null;
			importStep = 'upload';
			importResult = null;
		}
	});

	async function downloadTemplate() {
		try {
			const res = await apiClient('/classes/template');
			if (!res.ok) throw new Error('Gagal mengunduh template');
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'template-kelas.xlsx';
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

			const res = await apiClient('/classes/batch/excel', {
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
				await fetchClasses(currentPage, limit);
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
		if (filteredClasses.length === 0) {
			toast.error('Tidak ada data untuk diekspor');
			return;
		}

		const headers = ['No', 'Nama Kelas', 'Jurusan'];
		const rows = filteredClasses.map((item, i) => {
			return [i + 1, item.name, item.major?.name || item.majorId];
		});

		const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Data');
		XLSX.writeFile(wb, `data_class_${new Date().toISOString().slice(0, 10)}.xlsx`);

		toast.success('Data berhasil diekspor');
	};

	$effect(() => {
		if (handleExport !== exportData) {
			handleExport = exportData;
		}
	});
	function openEdit(cls: import('$lib/types').Class) {
		selectedClass = cls;
		formData = {
			name: cls.name || '',
			majorId: cls.majorId || ''
		};
		isEditOpen = true;
	}

	function openDelete(cls: import('$lib/types').Class) {
		selectedClass = cls;
		isDeleteOpen = true;
	}

	async function handleSave() {
		isSaving = true;
		try {
			const payload = { ...formData };
			if (isCreateOpen) {
				const res = await apiClient('/classes', { method: 'POST', body: JSON.stringify(payload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Kelas berhasil ditambahkan!');
					isCreateOpen = false;
					await fetchClasses(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal menambahkan kelas');
				}
			} else if (isEditOpen && selectedClass) {
				const res = await apiClient(`/classes/${selectedClass.id}`, {
					method: 'PUT',
					body: JSON.stringify(payload)
				});
				const result = await res.json();
				if (!result.error) {
					toast.success('Data kelas berhasil diperbarui!');
					isEditOpen = false;
					await fetchClasses(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal memperbarui kelas');
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
			if (!selectedClass) return;
			const res = await apiClient(`/classes/${selectedClass.id}`, { method: 'DELETE' });
			const result = await res.json();
			if (!result.error) {
				toast.success('Data kelas berhasil dihapus!');
				isDeleteOpen = false;
				await fetchClasses(currentPage, limit);
			} else {
				toast.error(result.message || 'Gagal menghapus kelas');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkDelete() {
		try {
			const res = await apiClient('/classes/batch/delete', {
				method: 'POST',
				body: JSON.stringify({ ids: selectedIds })
			});
			if (res.ok) {
				toast.success(`${selectedIds.length} Data kelas berhasil dihapus!`);
				isBulkDeleteOpen = false;
				selectedIds = [];
				fetchClasses(currentPage, limit);
			} else {
				toast.error('Gagal menghapus data masal');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	function toggleAll(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		selectedIds = checked ? filteredClasses.map((c) => c.id) : [];
	}

	let classes = $state<import('$lib/types').Class[]>([]);
	let majors = $state<import('$lib/types').Major[]>([]);
	let isLoading = $state(true);
	let currentPage = $state(1);
	let limit = $state(10);
	let totalPages = $state(1);
	let totalItems = $state(0);

	const fetchClasses = async (
		page: number,
		limitPerPage: number,
		search: string = '',
		majorsFilter: string[] = []
	) => {
		isLoading = true;
		try {
			const majorParam =
				majorsFilter.length > 0 ? `&majorId=${encodeURIComponent(majorsFilter.join(','))}` : '';
			const res = await apiClient(
				`/classes?page=${page}&limit=${limitPerPage}&includeMajor=true&includeCurrentStudent=true${search ? `&search=${encodeURIComponent(search)}` : ''}${majorParam}`
			);
			const result = await res.json();
			if (!result.error && result.data) {
				classes = Array.isArray(result.data) ? result.data : [];
				totalPages = result.pagination?.totalPage || 1;
				totalItems = result.pagination?.totalData || 0;
			} else {
				toast.error(result.message || 'Gagal memuat data kelas');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isLoading = false;
		}
	};

	const fetchMajors = async () => {
		try {
			const res = await apiClient('/majors?limit=1000');
			const result = await res.json();
			if (!result.error && result.data) {
				majors = Array.isArray(result.data) ? result.data : [];
			}
		} catch {
			console.error('Gagal memuat data jurusan');
		}
	};

	let previousSearch = $state('');
	let previousMajorFilter = $state<string[]>([]);

	$effect(() => {
		const majorFilterChanged =
			JSON.stringify(majorFilter) !== JSON.stringify(previousMajorFilter);
		if (searchQuery !== previousSearch || majorFilterChanged) {
			previousSearch = searchQuery;
			previousMajorFilter = [...majorFilter];
			currentPage = 1;
		}
		fetchClasses(currentPage, limit, searchQuery, majorFilter);
		fetchMajors();
	});

	let searchQuery = $state('');
	let majorFilter = $state<string[]>([]);

	let majorOptions = $derived(majors.map((m) => ({ label: m.name, value: m.id })));

	let filteredClasses = $derived(classes);
</script>

<div class="mb-md flex flex-col md:flex-row gap-sm items-center justify-between">
	<div class="flex flex-col md:flex-row gap-sm w-full md:w-auto h-auto">
		<SearchBar bind:value={searchQuery} placeholder="Cari nama kelas..." class="w-full md:w-80" />
		<Dropdown
			bind:value={majorFilter}
			options={majorOptions}
			placeholder="Semua Jurusan"
			class="w-full md:w-64 h-auto"
			multiple={true}
		/>
	</div>
</div>

{#if selectedIds.length > 0}
	<div
		class="mb-md p-sm bg-primary-container border-3 border-on-background rounded-lg flex items-center justify-between shadow-neo-sm"
	>
		<span class="font-body-bold text-body-bold">{selectedIds.length} Kelas dipilih</span>
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
					checked={selectedIds.length === filteredClasses.length && filteredClasses.length > 0}
					onchange={toggleAll}
				/>
			</TableHeadCell>
			<TableHeadCell>Nama Kelas</TableHeadCell>
			<TableHeadCell>Jurusan</TableHeadCell>
			<TableHeadCell align="center">Jumlah Murid</TableHeadCell>
			<TableHeadCell width="w-32" align="center">Aksi</TableHeadCell>
		</TableRow>
	</TableHead>
	<TableBody>
		{#if isLoading}
			<TableRow>
				<TableCell colspan={4} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Memuat data kelas...</span>
				</TableCell>
			</TableRow>
		{:else if filteredClasses.length === 0}
			<TableRow>
				<TableCell colspan={5} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Belum ada data kelas.</span>
				</TableCell>
			</TableRow>
		{:else}
			{#each filteredClasses as cls, i (cls.id)}
				<TableRow striped={i % 2 !== 0}>
					<TableCell align="center">
						<Checkbox bind:group={selectedIds} value={cls.id} />
					</TableCell>
					<TableCell><Badge color="#DBEAFE" class="text-xs">{cls.name}</Badge></TableCell>
					<TableCell>
						<div class="flex flex-col">
							<span class="font-body-base">{cls.major?.name || '-'}</span>
							<span class="text-xs opacity-70">{cls.major?.code || cls.majorId}</span>
						</div>
					</TableCell>
					<TableCell align="center">
						<Badge color="#F3E8FF" class="text-xs"
							>{(cls._count as Record<string, unknown>)?.currentStudents || 0}</Badge
						>
					</TableCell>
					<TableCell align="center">
						<div class="flex justify-center gap-xs">
							<ActionButton icon="edit" title="Edit" onclick={() => openEdit(cls)} />
							<ActionButton
								icon="delete"
								title="Hapus"
								variant="danger"
								onclick={() => openDelete(cls)}
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

<Modal bind:isOpen={isCreateOpen} title="Tambah Kelas">
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
				id="name-create"
				label="Nama Kelas"
				bind:value={formData.name}
				placeholder="Contoh: X RPL 1"
			/>
			<SelectField
				id="majorId-create"
				label="Jurusan"
				bind:value={formData.majorId}
				options={majorOptions}
			/>
		</div>
	{:else}
		{#if importStep === 'upload'}
			<div class="flex flex-col gap-sm">
				<div class="flex justify-between items-center">
					<p class="font-body-base text-body-base text-on-surface-variant">
						Unggah file Excel (.xlsx) yang berisi data kelas.
					</p>
					<Button variant="secondary" class="py-1 px-3 text-sm h-8" onclick={downloadTemplate}>
						<Icon name="download" class="text-sm mr-1" fill={0} /> Template
					</Button>
				</div>
				<FormField id="excel-bulk-class" label="File Excel" type="excel" bind:file={uploadedFile} />
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

<Modal bind:isOpen={isEditOpen} title="Edit Kelas">
	<div class="flex flex-col gap-sm">
		<FormField
			id="name-edit"
			label="Nama Kelas"
			bind:value={formData.name}
			placeholder="Contoh: X RPL 1"
		/>
		<SelectField
			id="majorId-edit"
			label="Jurusan"
			bind:value={formData.majorId}
			options={majorOptions}
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
	title="Hapus Kelas"
	message={`Apakah Anda yakin ingin menghapus kelas ${selectedClass?.name}? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus"
	cancelText="Batal"
	onConfirm={handleDelete}
/>

<ConfirmationModal
	bind:isOpen={isBulkDeleteOpen}
	type="danger"
	title="Hapus Masal Kelas"
	message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} data kelas yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus Semua"
	cancelText="Batal"
	onConfirm={handleBulkDelete}
/>
