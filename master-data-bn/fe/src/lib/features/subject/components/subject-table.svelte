<script lang="ts">
	import { Badge, Icon, Button, Checkbox } from '$lib/components/atoms';
	import { Pagination, SearchBar, Modal, FormField } from '$lib/components/molecules';
	import { ConfirmationModal } from '$lib/components/organisms';
	import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '$lib/components/organisms/table';
	import { toast } from '$lib/stores/toast.svelte';
	import { apiClient } from '$lib/utils/api';
	import * as XLSX from 'xlsx';

	let { isCreateOpen = $bindable(false), handleExport = $bindable() } = $props<{ isCreateOpen?: boolean, handleExport?: () => void }>();

	let isEditOpen = $state(false);
	let isDeleteOpen = $state(false);
	let selectedSubject = $state<import('$lib/types').Subject | null>(null);
	let selectedIds = $state<string[]>([]);
	let isBulkDeleteOpen = $state(false);

	let formData = $state({
		code: '',
		name: ''
	});

	$effect(() => {
		if (isCreateOpen) {
			formData = { code: '', name: '' };
		}
	});

	const exportData = () => {
		if (filteredSubjects.length === 0) {
			toast.error('Tidak ada data untuk diekspor');
			return;
		}
		
		const headers = ['No', 'Kode', 'Nama Mata Pelajaran'];
		const rows = filteredSubjects.map((item, i) => {
			return [i + 1, item.code, item.name];
		});

		const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Data");
		XLSX.writeFile(wb, `data_subject_${new Date().toISOString().slice(0,10)}.xlsx`);
		
		toast.success('Data berhasil diekspor');
	};

	$effect(() => {
		handleExport = exportData;
	});

	function openEdit(subject: import('$lib/types').Subject) {
		selectedSubject = subject;
		formData = { code: subject.code || "", name: subject.name || "" };
		isEditOpen = true;
	}

	function openDelete(subject: import('$lib/types').Subject) {
		selectedSubject = subject;
		isDeleteOpen = true;
	}

	async function handleSave() {
		try {
			const payload: Record<string, unknown> = { ...formData };
			
			if (isCreateOpen) {
				const res = await apiClient('/subjects', { method: 'POST', body: JSON.stringify(payload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Mata pelajaran berhasil ditambahkan!');
					isCreateOpen = false;
					await fetchSubjects(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal menambahkan mata pelajaran');
				}
			} else if (isEditOpen && selectedSubject) {
				const updatePayload = { name: payload.name, code: payload.code };
				const res = await apiClient(`/subjects/${selectedSubject.id}`, { method: 'PUT', body: JSON.stringify(updatePayload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Data mata pelajaran berhasil diperbarui!');
					isEditOpen = false;
					await fetchSubjects(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal memperbarui mata pelajaran');
				}
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleDelete() {
		try {
			if (!selectedSubject) return;
			const res = await apiClient(`/subjects/${selectedSubject.id}`, { method: 'DELETE' });
			const result = await res.json();
			if (!result.error) {
				toast.success('Mata pelajaran berhasil dihapus!');
				isDeleteOpen = false;
				await fetchSubjects(currentPage, limit);
			} else {
				toast.error(result.message || 'Gagal menghapus mata pelajaran');
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkDelete() {
		try {
			const res = await apiClient('/subjects/bulk', {
				method: 'DELETE',
				body: JSON.stringify({ ids: Array.from(selectedIds) })
			});
			const result = await res.json().catch(() => ({}));
			if (res.ok && !result.error) {
				toast.success(`${selectedIds.length} Mata pelajaran berhasil dihapus!`);
				isBulkDeleteOpen = false;
				selectedIds = [];
				await fetchSubjects(currentPage, limit);
			} else {
				toast.error(result.message || 'Gagal menghapus data masal');
			}
		} catch (error) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	function toggleAll(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		selectedIds = checked ? filteredSubjects.map(s => s.id) : [];
	}

	let subjects = $state<import('$lib/types').Subject[]>([]);
	let isLoading = $state(true);
	let currentPage = $state(1);
	let limit = $state(10);
	let totalPages = $state(1);
	let totalItems = $state(0);

	const fetchSubjects = async (page: number, limitPerPage: number) => {
		isLoading = true;
		try {
			const res = await apiClient(`/subjects?page=${page}&limit=${limitPerPage}`);
			const result = await res.json();
			if (!result.error && result.data) {
				subjects = Array.isArray(result.data) ? result.data : [];
				totalPages = result.pagination?.totalPage || 1;
				totalItems = result.pagination?.totalData || 0;
			} else {
				toast.error(result.message || 'Gagal memuat data mata pelajaran');
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isLoading = false;
		}
	};

	$effect(() => {
		fetchSubjects(currentPage, limit);
	});

	let searchQuery = $state('');
	
	let filteredSubjects = $derived(subjects.filter(s => {
		return (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
			   (s.code || "").toLowerCase().includes(searchQuery.toLowerCase());
	}));
</script>

<div class="mb-md flex flex-col md:flex-row gap-sm items-center justify-between">
	<div class="flex flex-col md:flex-row gap-sm w-full md:w-auto h-auto">
		<SearchBar bind:value={searchQuery} placeholder="Cari nama atau kode mapel..." class="w-full md:w-80 h-10" />
	</div>
</div>

{#if selectedIds.length > 0}
	<div class="mb-md p-sm bg-primary-container border-3 border-on-background rounded-lg flex items-center justify-between shadow-neo-sm">
		<span class="font-body-bold text-body-bold">{selectedIds.length} Mata Pelajaran dipilih</span>
		<Button variant="error" class="!w-36 !h-12" onclick={() => isBulkDeleteOpen = true}>Hapus Masal</Button>
	</div>
{/if}

<Table class="mb-0">
	<TableHead>
		<TableRow header>
			<TableHeadCell width="w-12" align="center">
				<Checkbox checked={selectedIds.length === filteredSubjects.length && filteredSubjects.length > 0} onchange={toggleAll} />
			</TableHeadCell>
			<TableHeadCell width="w-32" align="center">Kode</TableHeadCell>
			<TableHeadCell>Nama Mata Pelajaran</TableHeadCell>
			<TableHeadCell width="w-32" align="center">Aksi</TableHeadCell>
		</TableRow>
	</TableHead>
	<TableBody>
		{#if isLoading}
			<TableRow>
				<TableCell colspan={4} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Memuat data mata pelajaran...</span>
				</TableCell>
			</TableRow>
		{:else if filteredSubjects.length === 0}
			<TableRow>
				<TableCell colspan={4} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Belum ada data mata pelajaran.</span>
				</TableCell>
			</TableRow>
		{:else}
			{#each filteredSubjects as subject, i}
				<TableRow striped={i % 2 !== 0}>
					<TableCell align="center">
						<Checkbox bind:group={selectedIds} value={subject.id} />
					</TableCell>
					<TableCell align="center">
						<Badge color="#FCD34D" class="text-on-surface font-bold tracking-widest">{subject.code}</Badge>
					</TableCell>
					<TableCell class="font-body-bold text-body-bold">{subject.name}</TableCell>
					<TableCell align="center">
						<div class="flex justify-center gap-xs">
							<button onclick={() => openEdit(subject)} title="Edit" class="h-8 w-8 border-3 rounded-lg border-on-background bg-surface-container-highest flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors cursor-pointer">
								<Icon name="edit" class="text-base" fill={0} />
							</button>
							<button onclick={() => openDelete(subject)} title="Hapus" class="h-8 w-8 border-3 rounded-lg border-on-background bg-error-container text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-colors cursor-pointer">
								<Icon name="delete" class="text-base" fill={0} />
							</button>
						</div>
					</TableCell>
				</TableRow>
			{/each}
		{/if}
	</TableBody>
</Table>

<Pagination 
	currentPage={currentPage}
	totalPages={totalPages}
	totalItems={totalItems}
	itemsPerPage={limit}
	onPageChange={(page) => currentPage = page}
/>

<Modal bind:isOpen={isCreateOpen} title="Tambah Mata Pelajaran">
	<div class="flex flex-col gap-sm">
		<FormField id="code-create" label="Kode Mata Pelajaran" bind:value={formData.code} placeholder="Masukkan kode (contoh: MAT)" />
		<FormField id="name-create" label="Nama Mata Pelajaran" bind:value={formData.name} placeholder="Masukkan nama mata pelajaran" />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isCreateOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleSave}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isEditOpen} title="Edit Mata Pelajaran">
	<div class="flex flex-col gap-sm">
		<FormField id="code-edit" label="Kode Mata Pelajaran" bind:value={formData.code} placeholder="Masukkan kode (contoh: MAT)" />
		<FormField id="name-edit" label="Nama Mata Pelajaran" bind:value={formData.name} placeholder="Masukkan nama mata pelajaran" />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isEditOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleSave}>Simpan Perubahan</Button>
	{/snippet}
</Modal>

<ConfirmationModal
	bind:isOpen={isDeleteOpen}
	type="danger"
	title="Hapus Mata Pelajaran"
	message={`Apakah Anda yakin ingin menghapus mata pelajaran ${selectedSubject?.name}? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus"
	cancelText="Batal"
	onConfirm={handleDelete}
/>

<ConfirmationModal
	bind:isOpen={isBulkDeleteOpen}
	type="danger"
	title="Hapus Masal Mata Pelajaran"
	message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} mata pelajaran yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus Semua"
	cancelText="Batal"
	onConfirm={handleBulkDelete}
/>
