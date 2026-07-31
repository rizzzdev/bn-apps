<script lang="ts">
	import { Badge, Button, Icon, Checkbox } from '$lib/components/atoms';
	import { Pagination, SearchBar, Dropdown, Modal, FormField, SelectField } from '$lib/components/molecules';
	import { ConfirmationModal } from '$lib/components/organisms';
	import { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '$lib/components/organisms/table';
	import { toast } from '$lib/stores/toast.svelte';
	import * as XLSX from 'xlsx';
	import { apiClient } from '$lib/utils/api';
	import { PUBLIC_API_URL } from '$env/static/public';

	import { Tabs } from '$lib/components/molecules';

	let { isCreateOpen = $bindable(false), handleExport = $bindable() } = $props<{ isCreateOpen?: boolean, handleExport?: () => void }>();

	let isEditOpen = $state(false);
	let isDeleteOpen = $state(false);
	let isBulkEditOpen = $state(false);
	let selectedStudent = $state<import('$lib/types').Student | null>(null);
	let selectedIds = $state<string[]>([]);
	let bulkStatus = $state('');

	let formData = $state({
		fullname: '',
		nik: '',
		birthplace: '',
		birthdate: '',
		gender: '',
		religion: '',
		ethnicGroup: '',
		status: '',
		nis: '',
		nisn: '',
		height: '',
		weight: '',
		phoneNumber: '',
		email: '',
		password: '',
		currentClassId: '',
		currentMajorId: ''
	});

	const initialFormData = {
		fullname: '',
		nik: '',
		birthplace: '',
		birthdate: '',
		gender: '',
		religion: '',
		ethnicGroup: '',
		status: '',
		nis: '',
		nisn: '',
		height: '',
		weight: '',
		phoneNumber: '',
		email: '',
		password: '',
		currentClassId: '',
		currentMajorId: ''
	};

	// Picture state — managed via FormField type="image"
	let pictureFile = $state<File | null>(null);
	let picturePreview = $state<string>('');
	let isPictureDeleted = $state(false);
	let existingImageUrl = $state<string | null>(null);

	let activeTabId = $state('single');

	$effect(() => {
		if (!isCreateOpen && !isEditOpen) {
			formData = { ...initialFormData };
			pictureFile = null;
			picturePreview = '';
			isPictureDeleted = false;
			existingImageUrl = null;
			activeTabId = 'single';
			uploadedFile = null;
		}
	});

	const exportData = () => {
		if (filteredStudents.length === 0) {
			toast.error('Tidak ada data untuk diekspor');
			return;
		}
		
		const headers = ['ID', 'Nama Lengkap', 'NIK', 'NISN', 'NIS', 'Jenis Kelamin', 'Agama', 'Status'];
		
		const rows = filteredStudents.map(s => [
			s.id,
			s.fullname || s.name || '',
			s.nik || '',
			s.nisn || '',
			s.nis || '',
			s.gender || '',
			s.religion || '',
			s.status || ''
		]);

		const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Data Murid");
		XLSX.writeFile(wb, `data_murid_${new Date().toISOString().slice(0,10)}.xlsx`);
		
		toast.success('Data murid berhasil diekspor');
	};

	$effect(() => {
		handleExport = exportData;
	});

	async function openEdit(student: import('$lib/types').Student) {
		selectedStudent = student;
		formData = {
			fullname: student.fullname || student.name || '',
			nik: student.nik || '',
			birthplace: student.birthplace || '',
			birthdate: student.birthdate ? new Date(student.birthdate).toISOString().split('T')[0] : '',
			gender: student.gender || '',
			religion: (student.religion as string) || '',
			ethnicGroup: (student.ethnicGroup as string) || '',
			status: (student.status as string) || '',
			nis: student.nis || '',
			nisn: student.nisn || '',
			height: student.height?.toString() || '',
			weight: student.weight?.toString() || '',
			phoneNumber: student.phoneNumber || '',
			email: student.email || '',
			password: '',
			currentClassId: (student as any).currentClassId || '',
			currentMajorId: (student as any).currentMajorId || ''
		};
		// Set picture state for edit — fetch detail with picture
		pictureFile = null;
		picturePreview = '';
		isPictureDeleted = false;
		existingImageUrl = null;
		try {
			const detailRes = await apiClient(`/students/${student.id}?includePicture=true`);
			const detailResult = await detailRes.json();
			if (!detailResult.error && detailResult.data?.picture?.url) {
				existingImageUrl = `${PUBLIC_API_URL}/attachments/file/${detailResult.data.picture.url}`;
			}
		} catch {}
		isEditOpen = true;
	}

	function openDelete(student: import('$lib/types').Student) {
		selectedStudent = student;
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
				const res = await apiClient('/students', { method: 'POST', body: JSON.stringify(payload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Murid berhasil ditambahkan!');
					isCreateOpen = false;
					await fetchStudents(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal menambahkan murid');
				}
			} else if (isEditOpen && selectedStudent) {
				delete payload.nik;
				delete payload.nis;
				delete payload.nisn;
				delete payload.userId;
				
				const res = await apiClient(`/students/${selectedStudent.id}`, { method: 'PUT', body: JSON.stringify(payload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Data murid berhasil diperbarui!');
					isEditOpen = false;
					await fetchStudents(currentPage, limit);
				} else {
					toast.error(result.message || 'Gagal memperbarui murid');
				}
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	let isBulkDeleteOpen = $state(false);

	async function handleDelete() {
		try {
			if (!selectedStudent) return;
			const res = await apiClient(`/students/${selectedStudent.id}`, { method: 'DELETE' });
			const result = await res.json();
			if (!result.error) {
				toast.success('Data murid berhasil dihapus!');
				isDeleteOpen = false;
				await fetchStudents(currentPage, limit);
			} else {
				toast.error(result.message || 'Gagal menghapus murid');
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkDelete() {
		try {
			const res = await apiClient('/students/bulk', {
				method: 'DELETE',
				body: JSON.stringify({ ids: selectedIds })
			});
			if (res.ok) {
				toast.success(`${selectedIds.length} Data murid berhasil dihapus!`);
				isBulkDeleteOpen = false;
				selectedIds = [];
				fetchStudents(currentPage, limit);
			} else {
				toast.error('Gagal menghapus data masal');
			}
		} catch (error) {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkEdit() {
		try {
			const res = await apiClient('/students/bulk/status', {
				method: 'PATCH',
				body: JSON.stringify({ ids: selectedIds, status: bulkStatus })
			});
			if (res.ok) {
				toast.success(`${selectedIds.length} Data murid berhasil diperbarui statusnya!`);
				isBulkEditOpen = false;
				selectedIds = [];
				bulkStatus = '';
				fetchStudents(currentPage, limit);
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
			const res = await apiClient('/students/bulk/excel-template');
			if (!res.ok) throw new Error('Gagal mengunduh template');
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'students_template.xlsx';
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

			const res = await apiClient('/students/bulk/excel', {
				method: 'POST',
				body: formData
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.message || 'Gagal mengimpor data');
			}
			
			toast.success('Data murid berhasil ditambahkan dari file excel');
			isCreateOpen = false;
			uploadedFile = null;
			fetchStudents(currentPage, limit);
		} catch (error) {
			console.error(error);
			toast.error((error as any).message || 'Terjadi kesalahan saat memproses file');
		}
	}

	function toggleAll(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		selectedIds = checked ? filteredStudents.map(s => s.id) : [];
	}


	let students = $state<import('$lib/types').Student[]>([]);
	let isLoading = $state(true);
	let currentPage = $state(1);
	let limit = $state(10);
	let totalPages = $state(1);
	let totalItems = $state(0);

	let majors = $state<import('$lib/types').Major[]>([]);
	let classes = $state<import('$lib/types').Class[]>([]);

	const fetchMajorsAndClasses = async () => {
		try {
			const [resMajors, resClasses] = await Promise.all([
				apiClient('/majors?limit=1000'),
				apiClient('/classes?limit=1000')
			]);
			const resultMajors = await resMajors.json();
			const resultClasses = await resClasses.json();
			
			if (!resultMajors.error && resultMajors.data) {
				majors = Array.isArray(resultMajors.data) ? resultMajors.data : [];
			}
			if (!resultClasses.error && resultClasses.data) {
				classes = Array.isArray(resultClasses.data) ? resultClasses.data : [];
			}
		} catch (err) {
			console.error('Gagal memuat data jurusan atau kelas', err);
		}
	};

	const fetchStudents = async (page: number, limitPerPage: number) => {
		isLoading = true;
		try {
			const res = await apiClient(`/students?page=${page}&limit=${limitPerPage}&includeCurrentClass=true`);
			const result = await res.json();
			if (!result.error && result.data) {
				students = Array.isArray(result.data) ? result.data : [];
				totalPages = result.pagination?.totalPage || 1;
				totalItems = result.pagination?.totalData || 0;
			} else {
				toast.error(result.message || 'Gagal memuat data murid');
			}
		} catch (err) {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isLoading = false;
		}
	};

	$effect(() => {
		fetchStudents(currentPage, limit);
		fetchMajorsAndClasses();
	});

	let searchQuery = $state('');
	
	let statusFilter = $state<string[]>([]);

	const statusOptions = [
		{ label: 'Aktif', value: 'Aktif' },
		{ label: 'Tidak Aktif', value: 'Tidak_Aktif' },
		{ label: 'Lulus', value: 'Lulus' },
	];

	let majorOptions = $derived(majors.map(m => ({ label: m.name, value: m.id })));
	let classOptions = $derived(classes.filter(c => !formData.currentMajorId || c.majorId === formData.currentMajorId).map(c => ({ label: c.name, value: c.id })));

	let filteredStudents = $derived(students.filter(t => {
		const name = t.fullname || t.name || '';
		const nis = t.nis || '';
		const nisn = t.nisn || '';
		const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || nis.includes(searchQuery) || nisn.includes(searchQuery);
		const matchesStatus = statusFilter.length > 0 ? statusFilter.includes(t.status) : true;
		return matchesSearch && matchesStatus;
	}));
</script>

<div class="mb-md flex flex-col md:flex-row gap-sm items-center justify-between">
	<div class="flex flex-col md:flex-row gap-sm w-full md:w-auto h-auto">
		<SearchBar bind:value={searchQuery} placeholder="Cari nama, NIS, atau NISN..." class="w-full md:w-80 h-10" />
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
		<span class="font-body-bold text-body-bold">{selectedIds.length} Murid dipilih</span>
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
				<Checkbox checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0} onchange={toggleAll} />
			</TableHeadCell>
			<TableHeadCell>Nama Lengkap</TableHeadCell>
			<TableHeadCell>NIS / NISN</TableHeadCell>
			<TableHeadCell>Gender</TableHeadCell>
			<TableHeadCell align="center">Status</TableHeadCell>
			<TableHeadCell width="w-32" align="center">Aksi</TableHeadCell>
		</TableRow>
	</TableHead>
	<TableBody>
		{#if isLoading}
			<TableRow>
				<TableCell colspan={7} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Memuat data murid...</span>
				</TableCell>
			</TableRow>
		{:else if filteredStudents.length === 0}
			<TableRow>
				<TableCell colspan={7} align="center" class="py-xl">
					<span class="font-body-base text-on-surface-variant">Belum ada data murid.</span>
				</TableCell>
			</TableRow>
		{:else}
			{#each filteredStudents as student, i}
			<TableRow striped={i % 2 !== 0}>
				<TableCell align="center">
					<Checkbox bind:group={selectedIds} value={student.id} />
				</TableCell>
				<TableCell>
					<div class="flex flex-col">
						<span class="font-body-bold text-body-bold">{student.fullname || student.name || '-'}</span>
						{#if (student.currentClass as any)?.name}
							<Badge color="#DBEAFE" class="text-xs mt-1 w-fit">{(student.currentClass as any).name}</Badge>
						{/if}
					</div>
				</TableCell>
				<TableCell class="text-on-surface-variant">
					<div class="flex flex-col">
						<span>{student.nis}</span>
						<span class="text-xs opacity-70">{student.nisn}</span>
					</div>
				</TableCell>
				<TableCell>{student.gender === 'L' ? 'Laki-laki' : student.gender === 'P' ? 'Perempuan' : '-'}</TableCell>
				<TableCell align="center">
					{#if student.status === 'Aktif'}
						<Badge color="#10B981" class="text-2xs">Aktif</Badge>
					{:else if student.status === 'Tidak_Aktif'}
						<Badge color="#EF4444" class="text-2xs">Tidak Aktif</Badge>
					{:else if student.status === 'Lulus'}
						<Badge color="#3B82F6" class="text-2xs">Lulus</Badge>
					{:else}
						<Badge color="#64748B" class="text-2xs">-</Badge>
					{/if}
				</TableCell>
				<TableCell align="center">
					<div class="flex justify-center gap-xs">
						<a href={`/student/${student.id}`} title="Lihat Detail" class="h-8 w-8 border-3 rounded-lg border-on-background bg-surface-container-highest flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors">
							<Icon name="visibility" class="text-base" fill={0} />
						</a>
						<button onclick={() => openEdit(student)} title="Edit" class="h-8 w-8 border-3 rounded-lg border-on-background bg-surface-container-highest flex items-center justify-center hover:bg-secondary hover:text-on-secondary transition-colors cursor-pointer">
							<Icon name="edit" class="text-base" fill={0} />
						</button>
						<button onclick={() => openDelete(student)} title="Hapus" class="h-8 w-8 border-3 rounded-lg border-on-background bg-error-container text-error flex items-center justify-center hover:bg-error hover:text-on-error transition-colors cursor-pointer">
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

<Modal bind:isOpen={isCreateOpen} title="Tambah Murid">
	<Tabs 
		tabs={[
			{ id: 'single', label: 'Single Create', icon: 'add' }, 
			{ id: 'bulk', label: 'Import Excel', icon: 'upload_file' }
		]} 
		bind:activeTab={activeTabId} 
		class="mb-md"
	/>

	{#if activeTabId === 'single'}
		<div class="flex flex-col gap-sm">
			<FormField id="fullname-create" label="Nama Lengkap *" bind:value={formData.fullname} placeholder="Masukkan nama lengkap" />
			
			<FormField id="picture-create" label="Foto Profil" type="image" bind:file={pictureFile} bind:preview={picturePreview}
				markedForDeletion={false}
				onDeleteImage={() => {}}
				onRestoreImage={() => {}}
			/>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-sm">
				<FormField id="nik-create" label="NIK" bind:value={formData.nik} placeholder="Masukkan NIK" />
				<FormField id="nis-create" label="NIS" bind:value={formData.nis} placeholder="Masukkan NIS" />
				<FormField id="nisn-create" label="NISN" bind:value={formData.nisn} placeholder="Masukkan NISN" />
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
			<div class="grid grid-cols-1 md:grid-cols-3 gap-sm">
				<SelectField id="major-create" label="Jurusan" bind:value={formData.currentMajorId} options={[{value: '', label: 'Pilih Jurusan'}, ...majorOptions]} />
				<SelectField id="class-create" label="Kelas" bind:value={formData.currentClassId} options={[{value: '', label: 'Pilih Kelas'}, ...classOptions]} />
				<SelectField id="status-create" label="Status" bind:value={formData.status} options={[{value: 'Aktif', label: 'Aktif'}, {value: 'Tidak_Aktif', label: 'Tidak Aktif'}, {value: 'Lulus', label: 'Lulus'}]} />
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-sm">
			<div class="flex justify-between items-center">
				<p class="font-body-base text-body-base text-on-surface-variant">Unggah file Excel (.xlsx) yang berisi data murid.</p>
				<Button variant="secondary" class="py-1 px-3 text-sm h-8" onclick={downloadTemplate}>
					<Icon name="download" class="text-sm mr-1" fill={0} /> Template
				</Button>
			</div>
			<FormField id="excel-bulk" label="File Excel" type="excel" bind:file={uploadedFile} />
		</div>
	{/if}
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isCreateOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		{#if activeTabId === 'single'}
			<Button variant="info" onclick={handleSave}>Simpan</Button>
		{:else}
			<Button variant="info" disabled={!uploadedFile} onclick={handleBulkCreate}>Mulai Impor</Button>
		{/if}
	{/snippet}
</Modal>

<Modal bind:isOpen={isEditOpen} title="Edit Murid">
	<div class="flex flex-col gap-sm">
		<FormField id="fullname-edit" label="Nama Lengkap *" bind:value={formData.fullname} placeholder="Masukkan nama lengkap" />
		
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
			<FormField id="nik-edit" label="NIK" bind:value={formData.nik} placeholder="Masukkan NIK" />
			<FormField id="nis-edit" label="NIS" bind:value={formData.nis} placeholder="Masukkan NIS" />
			<FormField id="nisn-edit" label="NISN" bind:value={formData.nisn} placeholder="Masukkan NISN" />
			<SelectField id="gender-edit" label="Jenis Kelamin" bind:value={formData.gender} options={[{value: 'L', label: 'Laki-laki'}, {value: 'P', label: 'Perempuan'}]} />
			<FormField id="birthplace-edit" label="Tempat Lahir" bind:value={formData.birthplace} placeholder="Tempat lahir" />
			<FormField id="birthdate-edit" label="Tanggal Lahir" bind:value={formData.birthdate} type="date" />
			<SelectField id="religion-edit" label="Agama" bind:value={formData.religion} options={[{value: 'Islam', label: 'Islam'}, {value: 'Kristen', label: 'Kristen'}, {value: 'Katolik', label: 'Katolik'}, {value: 'Hindu', label: 'Hindu'}, {value: 'Buddha', label: 'Buddha'}, {value: 'Konghucu', label: 'Konghucu'}]} />
			<FormField id="ethnic-edit" label="Suku" bind:value={formData.ethnicGroup} placeholder="Contoh: Jawa, Sunda" />
			<FormField id="height-edit" label="Tinggi Badan (cm)" bind:value={formData.height} type="number" />
			<FormField id="weight-edit" label="Berat Badan (kg)" bind:value={formData.weight} type="number" />
			<FormField id="phone-edit" label="Nomor Telepon" bind:value={formData.phoneNumber} placeholder="Contoh: 0812..." />
			<FormField id="email-edit" label="Email" bind:value={formData.email} type="email" placeholder="email@contoh.com" />
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-sm">
			<SelectField id="major-edit" label="Jurusan" bind:value={formData.currentMajorId} options={[{value: '', label: 'Pilih Jurusan'}, ...majorOptions]} />
			<SelectField id="class-edit" label="Kelas" bind:value={formData.currentClassId} options={[{value: '', label: 'Pilih Kelas'}, ...classOptions]} />
			<SelectField id="status-edit" label="Status" bind:value={formData.status} options={[{value: 'Aktif', label: 'Aktif'}, {value: 'Tidak_Aktif', label: 'Tidak Aktif'}, {value: 'Lulus', label: 'Lulus'}]} />
		</div>
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isEditOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleSave}>Simpan Perubahan</Button>
	{/snippet}
</Modal>

<ConfirmationModal
	bind:isOpen={isDeleteOpen}
	type="danger"
	title="Hapus Data Murid"
	message={`Apakah Anda yakin ingin menghapus data murid ${selectedStudent?.fullname || selectedStudent?.name || ''}? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus"
	cancelText="Batal"
	onConfirm={handleDelete}
/>



<Modal bind:isOpen={isBulkEditOpen} title="Ubah Status Masal">
	<div class="flex flex-col gap-sm">
		<p class="font-body-base text-body-base text-on-surface-variant">Ubah status untuk {selectedIds.length} murid yang dipilih.</p>
		<SelectField id="bulk-status-edit" label="Status Baru" bind:value={bulkStatus} options={[{value: 'Aktif', label: 'Aktif'}, {value: 'Tidak_Aktif', label: 'Tidak Aktif'}, {value: 'Lulus', label: 'Lulus'}]} />
	</div>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => isBulkEditOpen = false} class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button>
		<Button variant="info" onclick={handleBulkEdit}>Simpan Perubahan</Button>
	{/snippet}
</Modal>

<ConfirmationModal
	bind:isOpen={isBulkDeleteOpen}
	type="danger"
	title="Hapus Masal Murid"
	message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} data murid yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus Semua"
	cancelText="Batal"
	onConfirm={handleBulkDelete}
/>
