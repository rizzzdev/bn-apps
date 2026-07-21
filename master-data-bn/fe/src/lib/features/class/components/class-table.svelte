<script lang="ts">
	import { Button, Icon, Checkbox, Badge } from '$lib/components/atoms';
	import { Pagination, SearchBar, Dropdown, Modal, FormField, SelectField } from '$lib/components/molecules';
	import { ConfirmationModal } from '$lib/components/organisms';
	import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '$lib/components/organisms/table';
	import { toast } from '$lib/stores/toast.svelte';
	import * as XLSX from 'xlsx';
	import { apiClient } from '$lib/utils/api';

	let { isCreateOpen = $bindable(false), handleExport = $bindable() } = $props<{ isCreateOpen?: boolean, handleExport?: () => void }>();

	let isEditOpen = $state(false);
	let isDeleteOpen = $state(false);
	let selectedClass = $state<import('$lib/types').Class | null>(null);
	let selectedIds = $state<string[]>([]);
	let isBulkDeleteOpen = $state(false);

	let formData = $state({
		name: '',
		majorId: ''
	});

	$effect(() => {
		if (isCreateOpen) {
			formData = { name: '', majorId: '' };
		}
	});

	
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
		XLSX.utils.book_append_sheet(wb, ws, "Data");
		XLSX.writeFile(wb, `data_class_${new Date().toISOString().slice(0,10)}.xlsx`);
		
		toast.success('Data berhasil diekspor');
	};

	$effect(() => {
		handleExport = exportData;
	});
	function openEdit(cls: import('$lib/types').Class) {
		selectedClass = cls;
		formData = { 
			name: cls.name || "", 
			majorId: cls.majorId || "" 
		};
		isEditOpen = true;
	}

	function openDelete(cls: import('$lib/types').Class) {
		selectedClass = cls;
		isDeleteOpen = true;
	}

	async function handleSave() {
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
				const res = await apiClient(`/classes/${selectedClass.id}`, { method: 'PUT', body: JSON.stringify(payload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Data kelas berhasil diperbarui!');
					isEditOpen = false;
					await fetchClasses(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal memperbarui kelas');
				}
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
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
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkDelete() {
		try {
			const res = await apiClient('/classes/bulk', {
				method: 'DELETE',
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
		} catch (error) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	function toggleAll(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		selectedIds = checked ? filteredClasses.map(c => c.id) : [];
	}

	let classes = $state<import('$lib/types').Class[]>([]);
	let majors = $state<import('$lib/types').Major[]>([]);
	let isLoading = $state(true);
	let currentPage = $state(1);
	let limit = $state(10);
	let totalPages = $state(1);
	let totalItems = $state(0);

	const fetchClasses = async (page: number, limitPerPage: number) => {
		isLoading = true;
		try {
			const res = await apiClient(`/classes?page=${page}&limit=${limitPerPage}&includeMajor=true&includeCurrentStudent=true`);
			const result = await res.json();
			if (!result.error && result.data) {
				classes = Array.isArray(result.data) ? result.data : [];
				totalPages = result.pagination?.totalPage || 1;
				totalItems = result.pagination?.totalData || 0;
			} else {
				toast.error(result.message || 'Gagal memuat data kelas');
			}
		} catch (err) {
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
		} catch (err) {
			console.error('Gagal memuat data jurusan', err);
		}
	};

	$effect(() => {
		fetchClasses(currentPage, limit);
		fetchMajors();
	});

	let searchQuery = $state('');
	let majorFilter = $state<string[]>([]);

	let majorOptions = $derived(majors.map(m => ({ label: m.name, value: m.id })));

	let filteredClasses = $derived(classes.filter(c => {
		const matchesSearch = (c.name || "").toLowerCase().includes(searchQuery.toLowerCase());
		const matchesMajor = majorFilter.length > 0 ? majorFilter.includes(c.majorId as string) : true;
		return matchesSearch && matchesMajor;
	}));
</script>

<div class="mb-md flex flex-col md:flex-row gap-sm items-center justify-between">
	<div class="flex flex-col md:flex-row gap-sm w-full md:w-auto h-auto">
		<SearchBar bind:value={searchQuery} placeholder="Cari nama kelas..." class="w-full md:w-80 h-10" />
		<Dropdown 
			bind:value={majorFilter} 
			options={majorOptions} 
			placeholder="Semua Jurusan" 
			class="w-full md:w-64 h-10" 
			multiple={true} 
		/>
	</div>
</div>

{#if selectedIds.length > 0}
	<div class="mb-md p-sm bg-primary-container border-3 border-on-background rounded-lg flex items-center justify-between shadow-neo-sm">
		<span class="font-body-bold text-body-bold">{selectedIds.length} Kelas dipilih</span>
		<Button variant="error" class="w-36! h-12!" onclick={() => isBulkDeleteOpen = true}>Hapus Masal</Button>
	</div>
{/if}

<Table class="mb-0">
	<TableHead>
		<TableRow header>
			<TableHeadCell width="w-12" align="center">
				<Checkbox checked={selectedIds.length === filteredClasses.length && filteredClasses.length > 0} onchange={toggleAll} />
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
			{#each filteredClasses as cls, i}
				<TableRow striped={i % 2 !== 0}>
					<TableCell align="center">
						<Checkbox bind:group={selectedIds} value={cls.id} />
					</TableCell>
					<TableCell><Badge color="#DBEAFE" class="text-sm">{cls.name}</Badge></TableCell>
					<TableCell>
						<div class="flex flex-col">
							<span class="font-body-base">{cls.major?.name || '-'}</span>
							<span class="text-xs opacity-70">{cls.major?.code || cls.majorId}</span>
						</div>
					</TableCell>
					<TableCell align="center">
						<Badge color="#F3E8FF" class="text-sm">{(cls._count as any)?.currentStudents || 0}</Badge>
					</TableCell>
					<TableCell align="center">
						<div class="flex justify-center gap-xs">
							<button onclick={() => openEdit(cls)} title="Edit" class="h-8 w-8 border-3 rounded-lg border-on-background bg-surface-container-highest flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors cursor-pointer">
								<Icon name="edit" class="text-base" fill={0} />
							</button>
							<button onclick={() => openDelete(cls)} title="Hapus" class="h-8 w-8 border-3 rounded-lg border-on-background bg-error-container text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-colors cursor-pointer">
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

<Modal bind:isOpen={isCreateOpen} title="Tambah Kelas">
	<div class="flex flex-col gap-sm">
		<FormField id="name-create" label="Nama Kelas" bind:value={formData.name} placeholder="Contoh: X RPL 1" />
		<SelectField id="majorId-create" label="Jurusan" bind:value={formData.majorId} options={majorOptions} />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isCreateOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleSave}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isEditOpen} title="Edit Kelas">
	<div class="flex flex-col gap-sm">
		<FormField id="name-edit" label="Nama Kelas" bind:value={formData.name} placeholder="Contoh: X RPL 1" />
		<SelectField id="majorId-edit" label="Jurusan" bind:value={formData.majorId} options={majorOptions} />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isEditOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleSave}>Simpan Perubahan</Button>
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
