<script lang="ts">
	import { Button, Icon, Checkbox, Badge } from '$lib/components/atoms';
	import { Pagination, SearchBar, Modal, FormField } from '$lib/components/molecules';
	import { ConfirmationModal } from '$lib/components/organisms';
	import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '$lib/components/organisms/table';
	import { toast } from '$lib/stores/toast.svelte';
	import { apiClient } from '$lib/utils/api';
	import * as XLSX from 'xlsx';

	let { isCreateOpen = $bindable(false), handleExport = $bindable() } = $props<{ isCreateOpen?: boolean, handleExport?: () => void }>();

	let isEditOpen = $state(false);
	let isDeleteOpen = $state(false);
	let selectedMajor = $state<import('$lib/types').Major | null>(null);
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
		if (filteredMajors.length === 0) {
			toast.error('Tidak ada data untuk diekspor');
			return;
		}
		
		const headers = ['No', 'Kode Jurusan', 'Nama Jurusan', 'Jumlah Kelas'];
		const rows = filteredMajors.map((item, i) => {
			const s = item; const m = item; const c = item; const a = item;
			return [i + 1, m.code, m.name, m.classCount];
		});

		const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Data");
		XLSX.writeFile(wb, `data_major_${new Date().toISOString().slice(0,10)}.xlsx`);
		
		toast.success('Data berhasil diekspor');
	};

	$effect(() => {
		handleExport = exportData;
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
				const res = await apiClient(`/majors/${selectedMajor.id}`, { method: 'PUT', body: JSON.stringify(payload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Data jurusan berhasil diperbarui!');
					isEditOpen = false;
					await fetchMajors(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal memperbarui jurusan');
				}
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
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
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkDelete() {
		try {
			const res = await apiClient('/majors/bulk', {
				method: 'DELETE',
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
		} catch (error) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	function toggleAll(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		selectedIds = checked ? filteredMajors.map(m => m.id) : [];
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
			const res = await apiClient(`/majors?page=${page}&limit=${limitPerPage}&includeCurrentStudent=true`);
			const result = await res.json();
			if (!result.error && result.data) {
				majors = Array.isArray(result.data) ? result.data : [];
				totalPages = result.pagination?.totalPage || 1;
				totalItems = result.pagination?.totalData || 0;
			} else {
				toast.error(result.message || 'Gagal memuat data jurusan');
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isLoading = false;
		}
	};

	$effect(() => {
		fetchMajors(currentPage, limit);
	});

	let searchQuery = $state('');

	let filteredMajors = $derived(majors.filter(m => {
		return m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.code.toLowerCase().includes(searchQuery.toLowerCase());
	}));
</script>

<div class="mb-md flex flex-col md:flex-row gap-sm items-center justify-between">
	<div class="flex flex-col md:flex-row gap-sm w-full md:w-auto h-auto">
		<SearchBar bind:value={searchQuery} placeholder="Cari kode atau nama jurusan..." class="w-full md:w-80 h-10" />
	</div>
</div>

{#if selectedIds.length > 0}
	<div class="mb-md p-sm bg-primary-container border-3 border-on-background rounded-lg flex items-center justify-between shadow-neo-sm">
		<span class="font-body-bold text-body-bold">{selectedIds.length} Jurusan dipilih</span>
		<Button variant="error" class="w-36! h-12!" onclick={() => isBulkDeleteOpen = true}>Hapus Masal</Button>
	</div>
{/if}

<Table class="mb-0">
	<TableHead>
		<TableRow header>
			<TableHeadCell width="w-12" align="center">
				<Checkbox checked={selectedIds.length === filteredMajors.length && filteredMajors.length > 0} onchange={toggleAll} />
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
			{#each filteredMajors as major, i}
				<TableRow striped={i % 2 !== 0}>
					<TableCell align="center">
						<Checkbox bind:group={selectedIds} value={major.id} />
					</TableCell>
					<TableCell><Badge color="#FEF08A" class="text-sm">{major.code}</Badge></TableCell>
					<TableCell>{major.name}</TableCell>
					<TableCell align="center">
						<Badge color="#DBEAFE" class="text-sm">{major._count?.classes || major.classCount || 0}</Badge>
					</TableCell>
					<TableCell align="center">
						<Badge color="#F3E8FF" class="text-sm">{(major._count as any)?.currentStudents || 0}</Badge>
					</TableCell>
					<TableCell align="center">
						<div class="flex justify-center gap-xs">
							<button onclick={() => openEdit(major)} title="Edit" class="h-8 w-8 border-3 rounded-lg border-on-background bg-surface-container-highest flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors cursor-pointer">
								<Icon name="edit" class="text-base" fill={0} />
							</button>
							<button onclick={() => openDelete(major)} title="Hapus" class="h-8 w-8 border-3 rounded-lg border-on-background bg-error-container text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-colors cursor-pointer">
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

<Modal bind:isOpen={isCreateOpen} title="Tambah Jurusan">
	<div class="flex flex-col gap-sm">
		<FormField id="code-create" label="Kode Jurusan" bind:value={formData.code} placeholder="Contoh: RPL" />
		<FormField id="name-create" label="Nama Jurusan" bind:value={formData.name} placeholder="Contoh: Rekayasa Perangkat Lunak" />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isCreateOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleSave}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isEditOpen} title="Edit Jurusan">
	<div class="flex flex-col gap-sm">
		<FormField id="code-edit" label="Kode Jurusan" bind:value={formData.code} placeholder="Contoh: RPL" />
		<FormField id="name-edit" label="Nama Jurusan" bind:value={formData.name} placeholder="Contoh: Rekayasa Perangkat Lunak" />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isEditOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleSave}>Simpan Perubahan</Button>
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
