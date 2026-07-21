<script lang="ts">
	import { Badge, Button, Icon, Checkbox } from '$lib/components/atoms';
	import { Pagination, SearchBar, Dropdown, Modal, FormField, SelectField } from '$lib/components/molecules';
	import { ConfirmationModal } from '$lib/components/organisms';
	import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '$lib/components/organisms/table';
	import { toast } from '$lib/stores/toast.svelte';
	import { apiClient } from '$lib/utils/api';
	import * as XLSX from 'xlsx';
	import { PUBLIC_API_URL } from '$env/static/public';

	let { isCreateOpen = $bindable(false), isBulkCreateOpen = $bindable(false), handleExport = $bindable() } = $props<{ isCreateOpen?: boolean; isBulkCreateOpen?: boolean, handleExport?: () => void }>();

	let isEditOpen = $state(false);
	let isDeleteOpen = $state(false);
	let isBulkEditOpen = $state(false);
	let selectedTeacher = $state<import('$lib/types').Teacher | null>(null);
	let selectedIds = $state<string[]>([]);
	let bulkStatus = $state('');

	let formData = $state({
		fullname: '',
		prefixTitle: '',
		suffixTitle: '',
		nik: '',
		nip: '',
		birthplace: '',
		birthdate: '',
		gender: '',
		religion: '',
		ethnicGroup: '',
		height: '',
		weight: '',
		phoneNumber: '',
		email: '',
		password: '',
		status: ''
	});

	const initialFormData = {
		fullname: '',
		prefixTitle: '',
		suffixTitle: '',
		nik: '',
		nip: '',
		birthplace: '',
		birthdate: '',
		gender: '',
		religion: '',
		ethnicGroup: '',
		height: '',
		weight: '',
		phoneNumber: '',
		email: '',
		password: '',
		status: ''
	};

	// Picture state — managed via FormField type="image"
	let pictureFile = $state<File | null>(null);
	let picturePreview = $state<string>('');
	let isPictureDeleted = $state(false);
	let existingImageUrl = $state<string | null>(null);

	$effect(() => {
		if (!isCreateOpen && !isEditOpen) {
			formData = { ...initialFormData };
			pictureFile = null;
			picturePreview = '';
			isPictureDeleted = false;
			existingImageUrl = null;
		}
	});

	const formatFullName = (teacher: import('$lib/types').Teacher) => {
		let name = teacher.fullname || teacher.name || '';
		if (teacher.prefixTitle) {
			name = `${teacher.prefixTitle.trim()} ${name.trim()}`;
		}
		if (teacher.suffixTitle) {
			name = `${name.trim()}, ${teacher.suffixTitle.trim()}`;
		}
		return name.trim();
	};

	const exportData = () => {
		if (filteredTeachers.length === 0) {
			toast.error('Tidak ada data untuk diekspor');
			return;
		}
		
		const headers = ['ID', 'Nama Lengkap', 'NIK', 'NIP', 'No. HP', 'Email', 'Jenis Kelamin', 'Status'];
		
		const rows = filteredTeachers.map(t => [
			t.id,
			formatFullName(t),
			t.nik || '',
			t.nip || '',
			t.phoneNumber || '',
			t.email || '',
			t.gender || '',
			t.status || ''
		]);

		const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Data Guru");
		XLSX.writeFile(wb, `data_guru_${new Date().toISOString().slice(0,10)}.xlsx`);
		
		toast.success('Data guru berhasil diekspor');
	};

	$effect(() => {
		handleExport = exportData;
	});

	async function openEdit(teacher: import('$lib/types').Teacher) {
		selectedTeacher = teacher;
		formData = {
			fullname: teacher.fullname || '',
			prefixTitle: teacher.prefixTitle || '',
			suffixTitle: teacher.suffixTitle || '',
			nik: teacher.nik || '',
			nip: teacher.nip || '',
			birthplace: teacher.birthplace || '',
			birthdate: teacher.birthdate ? new Date(teacher.birthdate).toISOString().split('T')[0] : '',
			gender: teacher.gender || '',
			religion: (teacher.religion as string) || '',
			ethnicGroup: (teacher.ethnicGroup as string) || '',
			height: (teacher.height as number)?.toString() || '',
			weight: teacher.weight?.toString() || '',
			phoneNumber: teacher.phoneNumber || '',
			email: teacher.email || '',
			password: '',
			status: teacher.status || ''
		};
		// Set picture state for edit — fetch detail with picture
		pictureFile = null;
		picturePreview = '';
		isPictureDeleted = false;
		existingImageUrl = null;
		try {
			const detailRes = await apiClient(`/teachers/${teacher.id}?includePicture=true`);
			const detailResult = await detailRes.json();
			if (!detailResult.error && detailResult.data?.picture?.url) {
				existingImageUrl = `${PUBLIC_API_URL}/attachments/file/${detailResult.data.picture.url}`;
			}
		} catch {}
		isEditOpen = true;
	}

	function openDelete(teacher: import('$lib/types').Teacher) {
		selectedTeacher = teacher;
		isDeleteOpen = true;
	}

	async function handleSave() {
		try {
			// Upload picture first if new file selected
			let pictureId: string | null | undefined = undefined;
			if (pictureFile) {
				const fd = new FormData();
				fd.append('file', pictureFile);
				const uploadRes = await apiClient('/attachments', { method: 'POST', body: fd });
				const uploadResult = await uploadRes.json();
				if (!uploadResult.error && uploadResult.data) {
					pictureId = uploadResult.data.id;
				} else {
					toast.error(uploadResult.message || 'Gagal mengupload foto');
					return;
				}
			} else if (isPictureDeleted) {
				pictureId = null;
			}

			const payload: Record<string, unknown> = { 
				...formData,
				...(pictureId !== undefined ? { pictureId } : {}),
				height: formData.height ? parseInt(formData.height) : undefined,
				weight: formData.weight ? parseInt(formData.weight) : undefined
			};
			
			// Hapus properti kosong agar tidak dikirim ke API
			Object.keys(payload).forEach(key => {
				if (payload[key] === '' || payload[key] === undefined) delete payload[key];
			});

			if (isCreateOpen) {
				const res = await apiClient('/teachers', { method: 'POST', body: JSON.stringify(payload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Guru berhasil ditambahkan!');
					isCreateOpen = false;
					await fetchTeachers(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal menambahkan guru');
				}
			} else if (isEditOpen && selectedTeacher) {
				delete payload.nik;
				delete payload.nip;
				delete payload.password; // Dont send password on update unless supported
				
				const res = await apiClient(`/teachers/${selectedTeacher.id}`, { method: 'PUT', body: JSON.stringify(payload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Data guru berhasil diperbarui!');
					isEditOpen = false;
					await fetchTeachers(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal memperbarui guru');
				}
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	let isBulkDeleteOpen = $state(false);

	async function handleDelete() {
		try {
			if (!selectedTeacher) return;
			const res = await apiClient(`/teachers/${selectedTeacher.id}`, { method: 'DELETE' });
			const result = await res.json();
			if (!result.error) {
				toast.success('Data guru berhasil dihapus!');
				isDeleteOpen = false;
				await fetchTeachers(currentPage, limit);
			} else {
				toast.error(result.message || 'Gagal menghapus guru');
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkDelete() {
		try {
			const res = await apiClient('/teachers/bulk', {
				method: 'DELETE',
				body: JSON.stringify({ ids: selectedIds })
			});
			if (res.ok) {
				toast.success(`${selectedIds.length} Data guru berhasil dihapus!`);
				isBulkDeleteOpen = false;
				selectedIds = [];
				fetchTeachers(currentPage, limit);
			} else {
				toast.error('Gagal menghapus data masal');
			}
		} catch (error) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkEdit() {
		try {
			const res = await apiClient('/teachers/bulk/status', {
				method: 'PATCH',
				body: JSON.stringify({ ids: selectedIds, status: bulkStatus })
			});
			if (res.ok) {
				toast.success(`${selectedIds.length} Data guru berhasil diperbarui statusnya!`);
				isBulkEditOpen = false;
				selectedIds = [];
				bulkStatus = '';
				fetchTeachers(currentPage, limit);
			} else {
				const result = await res.json();
				toast.error(result.message || 'Gagal mengubah status masal');
			}
		} catch (error) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	let uploadedFile: File | null = $state(null);
	
	const downloadTemplate = async () => {
		try {
			const res = await apiClient('/teachers/bulk/excel-template');
			if (!res.ok) throw new Error('Gagal mengunduh template');
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'teachers_template.xlsx';
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			toast.error('Gagal mengunduh template');
		}
	};

	async function handleBulkCreate() {
		if (!uploadedFile) {
			toast.error('Pilih file terlebih dahulu');
			return;
		}
		try {
			const formData = new FormData();
			formData.append('file', uploadedFile);

			const res = await apiClient('/teachers/bulk/excel', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.message || 'Gagal mengimpor data');
			}
			
			toast.success('Data guru berhasil ditambahkan dari file excel');
			isBulkCreateOpen = false;
			uploadedFile = null;
			fetchTeachers(currentPage, limit);
		} catch (error) {
			console.error(error);
			toast.error((error as any).message || 'Terjadi kesalahan saat memproses file');
		}
	}

	function toggleAll(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		selectedIds = checked ? filteredTeachers.map(t => t.id as any) : [];
	}

	let teachers = $state<import('$lib/types').Teacher[]>([]);
	let isLoading = $state(true);
	let currentPage = $state(1);
	let limit = $state(10);
	let totalPages = $state(1);
	let totalItems = $state(0);

	const fetchTeachers = async (page: number, limitPerPage: number) => {
		isLoading = true;
		try {
			const res = await apiClient(`/teachers?page=${page}&limit=${limitPerPage}`);
			const result = await res.json();
			if (!result.error && result.data) {
				teachers = Array.isArray(result.data) ? result.data : [];
				totalPages = result.pagination?.totalPage || 1;
				totalItems = result.pagination?.totalData || 0;
			} else {
				toast.error(result.message || 'Gagal memuat data guru');
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isLoading = false;
		}
	};

	$effect(() => {
		fetchTeachers(currentPage, limit);
	});

	let searchQuery = $state('');
	
	let statusFilter = $state<string[]>([]);

	const statusOptions = [
		{ label: 'Aktif', value: 'Aktif' },
		{ label: 'Tidak Aktif', value: 'Tidak_Aktif' },
		{ label: 'Pensiun', value: 'Pensiun' },
	];

	let filteredTeachers = $derived(teachers.filter(t => {
		const name = t.fullname || t.name || '';
		const nip = t.nip || '';
		const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || (nip || "").includes(searchQuery);
		const matchesStatus = statusFilter.length > 0 ? statusFilter.includes(t.status) : true;
		return matchesSearch && matchesStatus;
	}));
</script>

<div class="mb-md flex flex-col md:flex-row gap-sm items-center justify-between">
	<div class="flex flex-col md:flex-row gap-sm w-full md:w-auto h-auto">
		<SearchBar bind:value={searchQuery} placeholder="Cari nama atau NIP..." class="w-full md:w-80 h-10" />
		<Dropdown 
			bind:value={statusFilter} 
			options={statusOptions} 
			placeholder="Semua Status" 
			class="w-full md:w-64 h-10" 
			multiple={true} 
		/>
	</div>
</div>

{#if selectedIds.length > 0}
	<div class="mb-md p-sm bg-primary-container border-3 border-on-background rounded-lg flex items-center justify-between shadow-neo-sm">
		<span class="font-body-bold text-body-bold">{selectedIds.length} Guru dipilih</span>
		<div class="flex gap-sm">
			<Button variant="info" onclick={() => isBulkEditOpen = true}>Ubah Status Masal</Button>
			<Button variant="error" onclick={() => isBulkDeleteOpen = true}>Hapus Masal</Button>
		</div>
	</div>
{/if}

<Table class="mb-0">
	<TableHead>
		<TableRow header>
			<TableHeadCell width="w-12" align="center">
				<Checkbox checked={selectedIds.length === filteredTeachers.length && filteredTeachers.length > 0} onchange={toggleAll} />
			</TableHeadCell>
			<TableHeadCell>Nama Lengkap</TableHeadCell>
			<TableHeadCell>NIP / NIK</TableHeadCell>
			<TableHeadCell>Gender</TableHeadCell>
			<TableHeadCell align="center">Status</TableHeadCell>
			<TableHeadCell width="w-32" align="center">Aksi</TableHeadCell>
		</TableRow>
	</TableHead>
	<TableBody>
		{#if isLoading}
			<TableRow>
				<TableCell colspan={6} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Memuat data guru...</span>
				</TableCell>
			</TableRow>
		{:else if filteredTeachers.length === 0}
			<TableRow>
				<TableCell colspan={6} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Belum ada data guru.</span>
				</TableCell>
			</TableRow>
		{:else}
			{#each filteredTeachers as teacher, i}
				<TableRow striped={i % 2 !== 0}>
					<TableCell align="center">
						<Checkbox bind:group={selectedIds} value={teacher.id} />
					</TableCell>
					<TableCell class="font-body-bold text-body-bold">{formatFullName(teacher) || '-'}</TableCell>
					<TableCell class="text-on-surface-variant">
						<div class="flex flex-col">
							<span>{teacher.nip || '-'}</span>
							<span class="text-xs opacity-70">{teacher.nik || '-'}</span>
						</div>
					</TableCell>
					<TableCell>{teacher.gender === 'L' ? 'Laki-laki' : teacher.gender === 'P' ? 'Perempuan' : '-'}</TableCell>
					<TableCell align="center">
						{#if teacher.status === 'Aktif'}
							<Badge color="#10B981" class="text-2xs">Aktif</Badge>
						{:else if teacher.status === 'Tidak_Aktif'}
							<Badge color="#EF4444" class="text-2xs">Tidak Aktif</Badge>
						{:else if teacher.status === 'Pensiun'}
							<Badge color="#64748B" class="text-2xs">Pensiun</Badge>
						{:else}
							<Badge color="#9CA3AF" class="text-2xs">-</Badge>
						{/if}
					</TableCell>
					<TableCell align="center">
						<div class="flex justify-center gap-xs">
							<a href={`/teacher/${teacher.id}`} title="Lihat Detail" class="h-8 w-8 border-3 rounded-lg border-on-background bg-surface-container-highest flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors">
								<Icon name="visibility" class="text-base" fill={0} />
							</a>
							<button onclick={() => openEdit(teacher)} title="Edit" class="h-8 w-8 border-3 rounded-lg border-on-background bg-surface-container-highest flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors cursor-pointer">
								<Icon name="edit" class="text-base" fill={0} />
							</button>
							<button onclick={() => openDelete(teacher)} title="Hapus" class="h-8 w-8 border-3 rounded-lg border-on-background bg-error-container text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-colors cursor-pointer">
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

<Modal bind:isOpen={isCreateOpen} title="Tambah Guru">
	<div class="flex flex-col gap-sm">
		<FormField id="fullname-create" label="Nama Lengkap *" bind:value={formData.fullname} placeholder="Masukkan nama lengkap tanpa gelar" />
		
		<FormField id="picture-create" label="Foto Profil" type="image" bind:file={pictureFile} bind:preview={picturePreview}
			markedForDeletion={false}
			onDeleteImage={() => {}}
			onRestoreImage={() => {}}
		/>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-sm">
			<FormField id="prefix-create" label="Gelar Depan" bind:value={formData.prefixTitle} placeholder="Contoh: Dr., Ir." />
			<FormField id="suffix-create" label="Gelar Belakang" bind:value={formData.suffixTitle} placeholder="Contoh: S.Pd., M.Si." />
			<FormField id="nip-create" label="NIP" bind:value={formData.nip} placeholder="Masukkan NIP" />
			<FormField id="nik-create" label="NIK" bind:value={formData.nik} placeholder="Masukkan NIK" />
			<SelectField id="gender-create" label="Jenis Kelamin" bind:value={formData.gender} options={[{value: 'L', label: 'Laki-laki'}, {value: 'P', label: 'Perempuan'}]} />
			<FormField id="birthplace-create" label="Tempat Lahir" bind:value={formData.birthplace} placeholder="Tempat lahir" />
			<FormField id="birthdate-create" label="Tanggal Lahir" bind:value={formData.birthdate} type="date" />
			<SelectField id="religion-create" label="Agama" bind:value={formData.religion} options={[{value: 'Islam', label: 'Islam'}, {value: 'Kristen', label: 'Kristen'}, {value: 'Katolik', label: 'Katolik'}, {value: 'Hindu', label: 'Hindu'}, {value: 'Buddha', label: 'Buddha'}, {value: 'Konghucu', label: 'Konghucu'}]} />
			<FormField id="ethnic-create" label="Suku" bind:value={formData.ethnicGroup} placeholder="Contoh: Jawa, Sunda" />
			<FormField id="height-create" label="Tinggi Badan (cm)" bind:value={formData.height} type="number" />
			<FormField id="weight-create" label="Berat Badan (kg)" bind:value={formData.weight} type="number" />
			<FormField id="phone-create" label="Nomor Telepon" bind:value={formData.phoneNumber} placeholder="Contoh: 0812..." />
			<FormField id="email-create" label="Email *" bind:value={formData.email} type="email" placeholder="email@contoh.com" />
			<FormField id="password-create" label="Password *" bind:value={formData.password} type="password" placeholder="Minimal 8 karakter" />
		</div>
		<SelectField id="status-create" label="Status" bind:value={formData.status} options={[{value: 'Aktif', label: 'Aktif'}, {value: 'Tidak_Aktif', label: 'Tidak Aktif'}, {value: 'Pensiun', label: 'Pensiun'}]} />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isCreateOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleSave}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isEditOpen} title="Edit Guru">
	<div class="flex flex-col gap-sm">
		<FormField id="fullname-edit" label="Nama Lengkap *" bind:value={formData.fullname} placeholder="Masukkan nama lengkap tanpa gelar" />
		
		<FormField
			id="picture-edit"
			label="Foto Profil"
			type="image"
			bind:file={pictureFile}
			bind:preview={picturePreview}
			bind:existingImageUrl
			markedForDeletion={isPictureDeleted}
			onDeleteImage={() => { isPictureDeleted = true; }}
			onRestoreImage={() => { isPictureDeleted = false; }}
		/>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-sm">
			<FormField id="prefix-edit" label="Gelar Depan" bind:value={formData.prefixTitle} placeholder="Contoh: Dr., Ir." />
			<FormField id="suffix-edit" label="Gelar Belakang" bind:value={formData.suffixTitle} placeholder="Contoh: S.Pd., M.Si." />
			<FormField id="nip-edit" label="NIP" bind:value={formData.nip} placeholder="Masukkan NIP" />
			<FormField id="nik-edit" label="NIK" bind:value={formData.nik} placeholder="Masukkan NIK" />
			<SelectField id="gender-edit" label="Jenis Kelamin" bind:value={formData.gender} options={[{value: 'L', label: 'Laki-laki'}, {value: 'P', label: 'Perempuan'}]} />
			<FormField id="birthplace-edit" label="Tempat Lahir" bind:value={formData.birthplace} placeholder="Tempat lahir" />
			<FormField id="birthdate-edit" label="Tanggal Lahir" bind:value={formData.birthdate} type="date" />
			<SelectField id="religion-edit" label="Agama" bind:value={formData.religion} options={[{value: 'Islam', label: 'Islam'}, {value: 'Kristen', label: 'Kristen'}, {value: 'Katolik', label: 'Katolik'}, {value: 'Hindu', label: 'Hindu'}, {value: 'Buddha', label: 'Buddha'}, {value: 'Konghucu', label: 'Konghucu'}]} />
			<FormField id="ethnic-edit" label="Suku" bind:value={formData.ethnicGroup} placeholder="Contoh: Jawa, Sunda" />
			<FormField id="height-edit" label="Tinggi Badan (cm)" bind:value={formData.height} type="number" />
			<FormField id="weight-edit" label="Berat Badan (kg)" bind:value={formData.weight} type="number" />
			<FormField id="phone-edit" label="Nomor Telepon" bind:value={formData.phoneNumber} placeholder="Contoh: 0812..." />
			<FormField id="email-edit" label="Email *" bind:value={formData.email} type="email" placeholder="email@contoh.com" />
		</div>
		<SelectField id="status-edit" label="Status" bind:value={formData.status} options={[{value: 'Aktif', label: 'Aktif'}, {value: 'Tidak_Aktif', label: 'Tidak Aktif'}, {value: 'Pensiun', label: 'Pensiun'}]} />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isEditOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleSave}>Simpan Perubahan</Button>
	{/snippet}
</Modal>

<ConfirmationModal
	bind:isOpen={isDeleteOpen}
	type="danger"
	title="Hapus Data Guru"
	message={`Apakah Anda yakin ingin menghapus data guru ${selectedTeacher?.fullname || selectedTeacher?.name || ''}? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus"
	cancelText="Batal"
	onConfirm={handleDelete}
/>

<Modal bind:isOpen={isBulkCreateOpen} title="Tambah Masal Guru">
	<div class="flex flex-col gap-sm">
		<div class="flex justify-between items-center">
			<p class="font-body-base text-body-base text-on-surface-variant">Unggah file Excel (.xlsx) yang berisi data guru.</p>
			<Button variant="secondary" class="py-1 px-3 text-sm h-8" onclick={downloadTemplate}>
				<Icon name="download" class="text-sm mr-1" fill={0} /> Template
			</Button>
		</div>
		<FormField id="excel-bulk" label="File Excel" type="excel" bind:file={uploadedFile} />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isBulkCreateOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" disabled={!uploadedFile} onclick={handleBulkCreate}>Mulai Impor</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isBulkEditOpen} title="Ubah Status Masal">
	<div class="flex flex-col gap-sm">
		<p class="font-body-base text-body-base text-on-surface-variant">Ubah status untuk {selectedIds.length} guru yang dipilih.</p>
		<SelectField id="bulk-status-edit" label="Status Baru" bind:value={bulkStatus} options={[{value: 'Aktif', label: 'Aktif'}, {value: 'Tidak_Aktif', label: 'Tidak Aktif'}, {value: 'Pensiun', label: 'Pensiun'}]} />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isBulkEditOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleBulkEdit}>Simpan Perubahan</Button>
	{/snippet}
</Modal>

<ConfirmationModal
	bind:isOpen={isBulkDeleteOpen}
	type="danger"
	title="Hapus Masal Guru"
	message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} data guru yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus Semua"
	cancelText="Batal"
	onConfirm={handleBulkDelete}
/>
