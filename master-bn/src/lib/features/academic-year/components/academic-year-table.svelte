<script lang="ts">
	import { Button, Badge, Checkbox, ActionButton } from '$lib/components/atoms';
	import { Pagination, SearchBar, Modal, FormField, SelectField } from '$lib/components/molecules';
	import { ConfirmationModal } from '$lib/components/organisms';
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
	import SemesterModal from './semester-modal.svelte';
	import { apiClient } from '$lib/utils/api';

	let { isCreateOpen = $bindable(false), handleExport = $bindable() } = $props<{
		isCreateOpen?: boolean;
		handleExport?: () => void;
	}>();

	let isEditOpen = $state(false);
	let isDeleteOpen = $state(false);
	let isSemesterModalOpen = $state(false);
	let selectedAcademicYear = $state<import('$lib/types').AcademicYear | null>(null);
	let selectedIds = $state<string[]>([]);
	let isBulkDeleteOpen = $state(false);

	let formData = $state({
		startYear: '',
		endYear: '',
		status: ''
	});

	$effect(() => {
		if (isCreateOpen) {
			formData = { startYear: '', endYear: '', status: '' };
		}
	});

	const exportData = () => {
		if (filteredAcademicYears.length === 0) {
			toast.error('Tidak ada data untuk diekspor');
			return;
		}

		const headers = ['No', 'Kode', 'Tahun Mulai', 'Tahun Selesai', 'Status'];
		const rows = filteredAcademicYears.map((item, i) => {
			return [i + 1, item.code, item.startYear, item.endYear, item.status];
		});

		const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Data');
		XLSX.writeFile(wb, `data_academic-year_${new Date().toISOString().slice(0, 10)}.xlsx`);

		toast.success('Data berhasil diekspor');
	};

	$effect(() => {
		if (handleExport !== exportData) {
			handleExport = exportData;
		}
	});
	function openEdit(year: import('$lib/types').AcademicYear) {
		selectedAcademicYear = year;
		formData = {
			startYear: year.startYear || '',
			endYear: year.endYear || '',
			status: year.status
		};
		isEditOpen = true;
	}

	function openDelete(year: import('$lib/types').AcademicYear) {
		selectedAcademicYear = year;
		isDeleteOpen = true;
	}

	function openSemesterModal(year: import('$lib/types').AcademicYear) {
		selectedAcademicYear = year;
		isSemesterModalOpen = true;
	}

	async function handleSave() {
		try {
			// Backend expects startYear, endYear as integer.
			const payload = {
				...formData,
				startYear: parseInt(formData.startYear.toString()),
				endYear: formData.endYear ? parseInt(formData.endYear.toString()) : undefined
			};
			if (isCreateOpen) {
				const res = await apiClient('/academic-years', {
					method: 'POST',
					body: JSON.stringify(payload)
				});
				const result = await res.json();
				if (!result.error) {
					toast.success('Tahun Ajaran berhasil ditambahkan!');
					isCreateOpen = false;
					await fetchAcademicYears(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal menambahkan tahun ajaran');
				}
			} else if (isEditOpen && selectedAcademicYear) {
				const res = await apiClient(`/academic-years/${selectedAcademicYear.id}`, {
					method: 'PUT',
					body: JSON.stringify(payload)
				});
				const result = await res.json();
				if (!result.error) {
					toast.success('Data Tahun Ajaran berhasil diperbarui!');
					isEditOpen = false;
					await fetchAcademicYears(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal memperbarui tahun ajaran');
				}
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleDelete() {
		try {
			if (!selectedAcademicYear) return;
			const res = await apiClient(`/academic-years/${selectedAcademicYear.id}`, {
				method: 'DELETE'
			});
			const result = await res.json();
			if (!result.error) {
				toast.success('Data Tahun Ajaran berhasil dihapus!');
				isDeleteOpen = false;
				await fetchAcademicYears(currentPage, limit);
			} else {
				toast.error(result.message || 'Gagal menghapus tahun ajaran');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkDelete() {
		try {
			const res = await apiClient('/academic-years/batch', {
				method: 'DELETE',
				body: JSON.stringify({ ids: selectedIds })
			});
			if (res.ok) {
				toast.success(`${selectedIds.length} Data Tahun Ajaran berhasil dihapus!`);
				isBulkDeleteOpen = false;
				selectedIds = [];
				fetchAcademicYears(currentPage, limit);
			} else {
				toast.error('Gagal menghapus data masal');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	function toggleAll(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		selectedIds = checked ? filteredAcademicYears.map((y) => y.id) : [];
	}

	let academicYears = $state<import('$lib/types').AcademicYear[]>([]);
	let isLoading = $state(true);
	let currentPage = $state(1);
	let limit = $state(10);
	let totalPages = $state(1);
	let totalItems = $state(0);

	const fetchAcademicYears = async (page: number, limitPerPage: number, search: string = '') => {
		isLoading = true;
		try {
			const res = await apiClient(
				`/academic-years?page=${page}&limit=${limitPerPage}&includeSemesters=true${search ? `&search=${encodeURIComponent(search)}` : ''}`
			);
			const result = await res.json();
			if (!result.error && result.data) {
				academicYears = Array.isArray(result.data) ? result.data : [];
				totalPages = result.pagination?.totalPage || 1;
				totalItems = result.pagination?.totalData || 0;

				if (selectedAcademicYear) {
					const updated = academicYears.find((y) => y.id === selectedAcademicYear?.id);
					if (updated) selectedAcademicYear = updated;
				}
			} else {
				toast.error(result.message || 'Gagal memuat data tahun ajaran');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isLoading = false;
		}
	};

	let previousSearch = $state('');

	$effect(() => {
		if (searchQuery !== previousSearch) {
			previousSearch = searchQuery;
			currentPage = 1;
		}
		fetchAcademicYears(currentPage, limit, searchQuery);
	});

	let searchQuery = $state('');

	let filteredAcademicYears = $derived(academicYears);
</script>

<div class="mb-md flex flex-col md:flex-row gap-sm items-center justify-between">
	<div class="flex flex-col md:flex-row gap-sm w-full md:w-auto h-auto">
		<SearchBar
			bind:value={searchQuery}
			placeholder="Cari kode atau tahun..."
			class="w-full md:w-80"
		/>
	</div>
</div>

{#if selectedIds.length > 0}
	<div
		class="mb-md p-sm bg-primary-container border-3 border-on-background rounded-lg flex items-center justify-between shadow-neo-sm"
	>
		<span class="font-body-bold text-body-bold">{selectedIds.length} Tahun Ajaran dipilih</span>
		<Button variant="error" class="!w-36 !h-12" onclick={() => (isBulkDeleteOpen = true)}
			>Hapus Masal</Button
		>
	</div>
{/if}

<Table class="mb-0">
	<TableHead>
		<TableRow header>
			<TableHeadCell width="w-12" align="center">
				<Checkbox
					checked={selectedIds.length === filteredAcademicYears.length &&
						filteredAcademicYears.length > 0}
					onchange={toggleAll}
				/>
			</TableHeadCell>
			<TableHeadCell>Kode</TableHeadCell>
			<TableHeadCell>Tahun Mulai</TableHeadCell>
			<TableHeadCell>Tahun Selesai</TableHeadCell>
			<TableHeadCell>Status</TableHeadCell>
			<TableHeadCell width="w-40" align="center">Aksi</TableHeadCell>
		</TableRow>
	</TableHead>
	<TableBody>
		{#each filteredAcademicYears as year, i (year.id)}
			<TableRow striped={i % 2 !== 0}>
				<TableCell align="center">
					<Checkbox bind:group={selectedIds} value={year.id} />
				</TableCell>
				<TableCell class="font-body-bold text-body-bold">
					<Badge color="#ababab" class="text-xs">{year.code}</Badge>
				</TableCell>
				<TableCell>{year.startYear}</TableCell>
				<TableCell>{year.endYear}</TableCell>
				<TableCell>
					{#if year.status === 'Aktif'}
						<Badge color="#BBF7D0" class="text-xs">Aktif</Badge>
					{:else if year.status === 'Tidak_Aktif'}
						<Badge color="#FECACA" class="text-xs">Tidak Aktif</Badge>
					{:else}
						<Badge color="#BFDBFE" class="text-xs">Selesai</Badge>
					{/if}
				</TableCell>
				<TableCell align="center">
					<div class="flex justify-center gap-xs">
						<ActionButton
							icon="event_note"
							title="Kelola Semester"
							variant="info"
							onclick={() => openSemesterModal(year)}
						/>
						<ActionButton icon="edit" title="Edit" onclick={() => openEdit(year)} />
						<ActionButton
							icon="delete"
							title="Hapus"
							variant="danger"
							onclick={() => openDelete(year)}
						/>
					</div>
				</TableCell>
			</TableRow>
		{/each}
		{#if isLoading}
			<TableRow>
				<TableCell colspan={5} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Memuat data tahun ajaran...</span>
				</TableCell>
			</TableRow>
		{:else if filteredAcademicYears.length === 0}
			<TableRow>
				<TableCell colspan={5} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Tahun ajaran tidak ditemukan.</span>
				</TableCell>
			</TableRow>
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

<Modal bind:isOpen={isCreateOpen} title="Tambah Tahun Ajaran">
	<div class="flex flex-col gap-sm">
		<div class="flex gap-sm">
			<FormField
				id="startYear-create"
				label="Tahun Mulai"
				bind:value={formData.startYear}
				placeholder="2024"
			/>
			<FormField
				id="endYear-create"
				label="Tahun Selesai"
				bind:value={formData.endYear}
				placeholder="2025"
			/>
		</div>
		<SelectField
			id="status-create"
			label="Status"
			bind:value={formData.status}
			options={[
				{ value: 'Aktif', label: 'Aktif' },
				{ value: 'Tidak_Aktif', label: 'Tidak Aktif' },
				{ value: 'Selesai', label: 'Selesai' }
			]}
		/>
	</div>
	{#snippet footer()}
		<Button
			variant="secondary"
			onclick={() => (isCreateOpen = false)}
			class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button
		>
		<Button variant="info" onclick={handleSave}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isEditOpen} title="Edit Tahun Ajaran">
	<div class="flex flex-col gap-sm">
		<div class="flex gap-sm">
			<FormField
				id="startYear-edit"
				label="Tahun Mulai"
				bind:value={formData.startYear}
				placeholder="2024"
			/>
			<FormField
				id="endYear-edit"
				label="Tahun Selesai"
				bind:value={formData.endYear}
				placeholder="2025"
			/>
		</div>
		<SelectField
			id="status-edit"
			label="Status"
			bind:value={formData.status}
			options={[
				{ value: 'Aktif', label: 'Aktif' },
				{ value: 'Tidak_Aktif', label: 'Tidak Aktif' },
				{ value: 'Selesai', label: 'Selesai' }
			]}
		/>
	</div>
	{#snippet footer()}
		<Button
			variant="secondary"
			onclick={() => (isEditOpen = false)}
			class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button
		>
		<Button variant="info" onclick={handleSave}>Simpan Perubahan</Button>
	{/snippet}
</Modal>

<ConfirmationModal
	bind:isOpen={isDeleteOpen}
	type="danger"
	title="Hapus Tahun Ajaran"
	message={`Apakah Anda yakin ingin menghapus tahun ajaran ${selectedAcademicYear?.code}? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus"
	cancelText="Batal"
	onConfirm={handleDelete}
/>

<ConfirmationModal
	bind:isOpen={isBulkDeleteOpen}
	type="danger"
	title="Hapus Masal Tahun Ajaran"
	message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} data tahun ajaran yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus Semua"
	cancelText="Batal"
	onConfirm={handleBulkDelete}
/>

<SemesterModal
	bind:isOpen={isSemesterModalOpen}
	academicYear={selectedAcademicYear}
	onUpdate={() => fetchAcademicYears(currentPage, limit)}
/>
