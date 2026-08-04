<script lang="ts">
	import { Badge, Button, Icon, Checkbox, ActionButton } from '$lib/components/atoms';
	import {
		Pagination,
		SearchBar,
		Dropdown,
		Modal,
		FormField,
		SelectField
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
	import { apiClient, getApiBaseUrl } from '$lib/utils/api';
	import { PUBLIC_API_URL } from '$env/static/public';

	import { Tabs } from '$lib/components/molecules';

	let {
		isCreateOpen = $bindable(false),
		// eslint-disable-next-line no-useless-assignment
		handleExport = $bindable(),
		onDataChange = $bindable()
	} = $props<{ isCreateOpen?: boolean; handleExport?: () => void; onDataChange?: () => void }>();

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

	const CLEARABLE_FIELDS = ['nik', 'nis', 'nisn'];

	// Picture state — managed via FormField type="image"
	let pictureFile = $state<File | null>(null);
	let picturePreview = $state<string>('');
	let isPictureDeleted = $state(false);
	let existingImageUrl = $state<string | null>(null);

	let activeTabId = $state('single');
	let isSaving = $state(false);
	let importStep = $state<'upload' | 'preview' | 'result'>('upload');
	let importResult = $state<{
		successCount: number;
		successRows: Record<string, unknown>[];
		failedRows: Record<string, unknown>[];
	} | null>(null);

	const previewColumns = [
		{ key: 'Nama Lengkap', label: 'Nama Lengkap' },
		{ key: 'Email', label: 'Email' },
		{ key: 'NIS', label: 'NIS' },
		{ key: 'NISN', label: 'NISN' },
		{ key: 'Jenis Kelamin', label: 'Gender' },
		{ key: 'Status', label: 'Status' }
	];

	const resultSuccessColumns = [
		{ key: 'fullname', label: 'Nama Lengkap' },
		{ key: 'email', label: 'Email' },
		{ key: 'nis', label: 'NIS' },
		{ key: 'nisn', label: 'NISN' },
		{ key: 'status', label: 'Status' }
	];

	const resultFailedColumns = [
		{ key: 'fullname', label: 'Nama Lengkap' },
		{ key: 'email', label: 'Email' },
		{ key: 'reason', label: 'Alasan Gagal' }
	];

	$effect(() => {
		if (!isCreateOpen && !isEditOpen) {
			formData = { ...initialFormData };
			pictureFile = null;
			picturePreview = '';
			isPictureDeleted = false;
			existingImageUrl = null;
			activeTabId = 'single';
			uploadedFile = null;
			importStep = 'upload';
			importResult = null;
		}
	});

	const exportData = () => {
		if (filteredStudents.length === 0) {
			toast.error('Tidak ada data untuk diekspor');
			return;
		}

		const headers = [
			'ID',
			'Nama Lengkap',
			'NIS',
			'NISN',
			'NIK',
			'Email',
			'No. Telepon',
			'Tempat Lahir',
			'Tanggal Lahir',
			'Jenis Kelamin',
			'Agama',
			'Suku',
			'Tinggi Badan',
			'Berat Badan',
			'Status'
		];

		const rows = filteredStudents.map((s) => [
			s.id,
			s.fullname || s.name || '',
			s.nis || '',
			s.nisn || '',
			s.nik || '',
			s.email || '',
			s.phoneNumber || s.phone || '',
			s.birthplace || '',
			s.birthdate ? new Date(s.birthdate).toLocaleDateString('id-ID') : '',
			s.gender || '',
			s.religion || '',
			s.ethnicGroup || '',
			s.height || '',
			s.weight || '',
			s.status || ''
		]);

		const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Data Murid');
		XLSX.writeFile(wb, `data_murid_${new Date().toISOString().slice(0, 10)}.xlsx`);

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
			currentClassId: student.currentClass?.id || '',
			currentMajorId: student.currentMajor?.id || ''
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
				existingImageUrl = `${getApiBaseUrl()}/master/attachments/file/${detailResult.data.picture.url}`;
			}
		} catch {
			// Ignore picture fetch errors
		}
		isEditOpen = true;
	}

	function openDelete(student: import('$lib/types').Student) {
		selectedStudent = student;
		isDeleteOpen = true;
	}

	async function handleSave() {
		isSaving = true;
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

			// Hapus properti kosong agar tidak dikirim ke API, kecuali field yang boleh dikosongkan saat edit
			Object.keys(payload).forEach((key) => {
				if (payload[key] === undefined) delete payload[key];
				else if (
					payload[key] === '' &&
					!(isEditOpen && selectedStudent && CLEARABLE_FIELDS.includes(key))
				)
					delete payload[key];
			});

			if (isCreateOpen) {
				const res = await apiClient('/students', { method: 'POST', body: JSON.stringify(payload) });
				const result = await res.json();
				if (!result.error) {
					toast.success('Murid berhasil ditambahkan!');
					isCreateOpen = false;
					await fetchStudents(currentPage, limit);
					onDataChange?.();
				} else {
					toast.error(result.message || 'Gagal menambahkan murid');
				}
			} else if (isEditOpen && selectedStudent) {
				delete payload.userId;

				const res = await apiClient(`/students/${selectedStudent.id}`, {
					method: 'PUT',
					body: JSON.stringify(payload)
				});
				const result = await res.json();
				if (!result.error) {
					toast.success('Data murid berhasil diperbarui!');
					isEditOpen = false;
					await fetchStudents(currentPage, limit);
					onDataChange?.();
				} else {
					toast.error(result.message || 'Gagal memperbarui murid');
				}
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		} finally {
			isSaving = false;
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
				onDataChange?.();
			} else {
				toast.error(result.message || 'Gagal menghapus murid');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkDelete() {
		try {
			const res = await apiClient('/students/batch/delete', {
				method: 'POST',
				body: JSON.stringify({ ids: selectedIds })
			});
			if (res.ok) {
				toast.success(`${selectedIds.length} Data murid berhasil dihapus!`);
				isBulkDeleteOpen = false;
				selectedIds = [];
				fetchStudents(currentPage, limit);
				onDataChange?.();
			} else {
				toast.error('Gagal menghapus data masal');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	async function handleBulkEdit() {
		try {
			const res = await apiClient('/students/batch/status', {
				method: 'PATCH',
				body: JSON.stringify({ ids: selectedIds, status: bulkStatus })
			});
			if (res.ok) {
				toast.success(`${selectedIds.length} Data murid berhasil diperbarui statusnya!`);
				isBulkEditOpen = false;
				selectedIds = [];
				bulkStatus = '';
				fetchStudents(currentPage, limit);
				onDataChange?.();
			} else {
				const result = await res.json();
				toast.error(result.message || 'Gagal mengubah status masal');
			}
		} catch {
			toast.error('Terjadi kesalahan koneksi');
		}
	}

	let uploadedFile: File | null = $state(null);

	const downloadTemplate = async () => {
		try {
			const res = await apiClient('/students/template');
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
		} catch {
			toast.error('Gagal mengunduh template');
		}
	};

	async function handleBulkCreate() {
		if (!uploadedFile) {
			toast.error('Pilih file terlebih dahulu');
			return;
		}
		isSaving = true;
		try {
			const formData = new FormData();
			formData.append('file', uploadedFile);

			const res = await apiClient('/students/batch/excel', {
				method: 'POST',
				body: formData
			});

			const result = await res.json();
			if (!res.ok || result.error) {
				throw new Error(result.message || 'Gagal mengimpor data');
			}

			importResult = result.data;
			importStep = 'result';
			toast.success(
				`Berhasil: ${result.data.successCount} data, Gagal: ${result.data.failedRows.length} data`
			);
			fetchStudents(currentPage, limit);
			onDataChange?.();
		} catch (error) {
			console.error(error);
			toast.error(
				(error instanceof Error ? error.message : null) || 'Terjadi kesalahan saat memproses file'
			);
		} finally {
			isSaving = false;
		}
	}

	function handlePreviewConfirm() {
		importStep = 'preview';
	}

	function handleConfirmUpload() {
		handleBulkCreate();
	}

	function handleCancelImport() {
		importStep = 'upload';
		importResult = null;
		uploadedFile = null;
	}

	function toggleAll(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		selectedIds = checked ? filteredStudents.map((s) => s.id) : [];
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
			console.error('Gagal memuat data jurusan atau kelas:', err);
		}
	};

	const fetchStudents = async (page: number, limitPerPage: number, search: string = '') => {
		isLoading = true;
		try {
			const res = await apiClient(
				`/students?page=${page}&limit=${limitPerPage}&includeCurrentClass=true${search ? `&search=${encodeURIComponent(search)}` : ''}`
			);
			const result = await res.json();
			if (!result.error && result.data) {
				students = Array.isArray(result.data) ? result.data : [];
				totalPages = result.pagination?.totalPage || 1;
				totalItems = result.pagination?.totalData || 0;
			} else {
				toast.error(result.message || 'Gagal memuat data murid');
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
		fetchStudents(currentPage, limit, searchQuery);
		fetchMajorsAndClasses();
	});

	let searchQuery = $state('');

	let statusFilter = $state<string[]>([]);

	const statusOptions = [
		{ label: 'Aktif', value: 'Aktif' },
		{ label: 'Tidak Aktif', value: 'Tidak_Aktif' },
		{ label: 'Lulus', value: 'Lulus' }
	];

	let majorOptions = $derived(majors.map((m) => ({ label: m.name, value: m.id })));
	let classOptions = $derived(
		classes
			.filter((c) => !formData.currentMajorId || c.majorId === formData.currentMajorId)
			.map((c) => ({ label: c.name, value: c.id }))
	);

	let filteredStudents = $derived(
		students.filter((t) => {
			const matchesStatus = statusFilter.length > 0 ? statusFilter.includes(t.status) : true;
			return matchesStatus;
		})
	);
</script>

<div class="mb-md flex flex-col md:flex-row gap-sm items-center justify-between">
	<div class="flex flex-col md:flex-row gap-sm w-full md:w-auto">
		<SearchBar
			bind:value={searchQuery}
			placeholder="Cari nama, NIS, atau NISN..."
			class="w-full md:w-80"
		/>
		<Dropdown
			bind:value={statusFilter}
			options={statusOptions}
			placeholder="Semua Status"
			class="w-full md:w-64"
			multiple={true}
		/>
	</div>
</div>

{#if selectedIds.length > 0}
	<div
		class="mb-md p-sm bg-primary-container border-3 border-on-background rounded-lg flex items-center justify-between shadow-neo-sm"
	>
		<span class="font-body-bold text-body-bold">{selectedIds.length} Murid dipilih</span>
		<div class="flex gap-sm">
			<Button variant="info" onclick={() => (isBulkEditOpen = true)}>Ubah Status Masal</Button>
			<Button variant="error" onclick={() => (isBulkDeleteOpen = true)}>Hapus Masal</Button>
		</div>
	</div>
{/if}

<Table class="mb-0">
	<TableHead>
		<TableRow header>
			<TableHeadCell width="w-12" align="center">
				<Checkbox
					checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
					onchange={toggleAll}
				/>
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
			{#each filteredStudents as student, i (student.id)}
				<TableRow striped={i % 2 !== 0}>
					<TableCell align="center">
						<Checkbox bind:group={selectedIds} value={student.id} />
					</TableCell>
					<TableCell>
						<div class="flex flex-col">
							<span class="font-body-bold text-body-bold"
								>{student.fullname || student.name || '-'}</span
							>
							{#if student.currentClass?.name}
								<Badge color="#DBEAFE" class="text-xs mt-1 w-fit">{student.currentClass.name}</Badge
								>
							{/if}
						</div>
					</TableCell>
					<TableCell class="text-on-surface-variant">
						<div class="flex flex-col">
							<span>{student.nis}</span>
							<span class="text-xs opacity-70">{student.nisn}</span>
						</div>
					</TableCell>
					<TableCell
						>{student.gender === 'L'
							? 'Laki-laki'
							: student.gender === 'P'
								? 'Perempuan'
								: '-'}</TableCell
					>
					<TableCell align="center">
						{#if student.status === 'Aktif'}
							<Badge color="#BBF7D0" class="text-xs">Aktif</Badge>
						{:else if student.status === 'Tidak_Aktif'}
							<Badge color="#FECACA" class="text-xs">Tidak Aktif</Badge>
						{:else if student.status === 'Lulus'}
							<Badge color="#BFDBFE" class="text-xs">Lulus</Badge>
						{:else}
							<Badge color="#E2E8F0" class="text-xs">-</Badge>
						{/if}
					</TableCell>
					<TableCell align="center">
						<div class="flex justify-center gap-xs">
							<ActionButton
								icon="visibility"
								title="Lihat Detail"
								href={`/student/${student.id}`}
							/>
							<ActionButton icon="edit" title="Edit" onclick={() => openEdit(student)} />
							<ActionButton
								icon="delete"
								title="Hapus"
								variant="danger"
								onclick={() => openDelete(student)}
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
			<FormField
				id="fullname-create"
				label="Nama Lengkap *"
				bind:value={formData.fullname}
				placeholder="Masukkan nama lengkap"
			/>

			<FormField
				id="picture-create"
				label="Foto Profil"
				type="image"
				bind:file={pictureFile}
				bind:preview={picturePreview}
				markedForDeletion={false}
				onDeleteImage={() => {}}
				onRestoreImage={() => {}}
			/>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-sm">
				<FormField
					id="nik-create"
					label="NIK"
					bind:value={formData.nik}
					placeholder="Masukkan NIK"
				/>
				<FormField
					id="nis-create"
					label="NIS"
					bind:value={formData.nis}
					placeholder="Masukkan NIS"
				/>
				<FormField
					id="nisn-create"
					label="NISN"
					bind:value={formData.nisn}
					placeholder="Masukkan NISN"
				/>
				<SelectField
					id="gender-create"
					label="Jenis Kelamin"
					bind:value={formData.gender}
					options={[
						{ value: 'L', label: 'Laki-laki' },
						{ value: 'P', label: 'Perempuan' }
					]}
				/>
				<FormField
					id="birthplace-create"
					label="Tempat Lahir"
					bind:value={formData.birthplace}
					placeholder="Tempat lahir"
				/>
				<FormField
					id="birthdate-create"
					label="Tanggal Lahir"
					bind:value={formData.birthdate}
					type="date"
				/>
				<SelectField
					id="religion-create"
					label="Agama"
					bind:value={formData.religion}
					options={[
						{ value: 'Islam', label: 'Islam' },
						{ value: 'Kristen', label: 'Kristen' },
						{ value: 'Katolik', label: 'Katolik' },
						{ value: 'Hindu', label: 'Hindu' },
						{ value: 'Buddha', label: 'Buddha' },
						{ value: 'Konghucu', label: 'Konghucu' }
					]}
				/>
				<FormField
					id="ethnic-create"
					label="Suku"
					bind:value={formData.ethnicGroup}
					placeholder="Contoh: Jawa, Sunda"
				/>
				<FormField
					id="height-create"
					label="Tinggi Badan (cm)"
					bind:value={formData.height}
					type="number"
				/>
				<FormField
					id="weight-create"
					label="Berat Badan (kg)"
					bind:value={formData.weight}
					type="number"
				/>
				<FormField
					id="phone-create"
					label="Nomor Telepon"
					bind:value={formData.phoneNumber}
					placeholder="Contoh: 0812..."
				/>
				<FormField
					id="email-create"
					label="Email *"
					bind:value={formData.email}
					type="email"
					placeholder="email@contoh.com"
				/>
				<FormField
					id="password-create"
					label="Password *"
					bind:value={formData.password}
					type="password"
					placeholder="Minimal 8 karakter"
				/>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-sm">
				<SelectField
					id="major-create"
					label="Jurusan"
					bind:value={formData.currentMajorId}
					options={[{ value: '', label: 'Pilih Jurusan' }, ...majorOptions]}
				/>
				<SelectField
					id="class-create"
					label="Kelas"
					bind:value={formData.currentClassId}
					options={[{ value: '', label: 'Pilih Kelas' }, ...classOptions]}
				/>
				<SelectField
					id="status-create"
					label="Status"
					bind:value={formData.status}
					options={[
						{ value: 'Aktif', label: 'Aktif' },
						{ value: 'Tidak_Aktif', label: 'Tidak Aktif' },
						{ value: 'Lulus', label: 'Lulus' }
					]}
				/>
			</div>
		</div>
	{:else}
		{#if importStep === 'upload'}
			<div class="flex flex-col gap-sm">
				<div class="flex justify-between items-center">
					<p class="font-body-base text-body-base text-on-surface-variant">
						Unggah file Excel (.xlsx) yang berisi data murid.
					</p>
					<Button variant="secondary" class="py-1 px-3 text-sm h-8" onclick={downloadTemplate}>
						<Icon name="download" class="text-sm mr-1" fill={0} /> Template
					</Button>
				</div>
				<FormField id="excel-bulk" label="File Excel" type="excel" bind:file={uploadedFile} />
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
				isProcessing={isSaving}
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
			disabled={isSaving}>Batal</Button
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

<Modal bind:isOpen={isEditOpen} title="Edit Murid">
	<div class="flex flex-col gap-sm">
		<FormField
			id="fullname-edit"
			label="Nama Lengkap *"
			bind:value={formData.fullname}
			placeholder="Masukkan nama lengkap"
		/>

		<FormField
			id="picture-edit"
			label="Foto Profil"
			type="image"
			bind:file={pictureFile}
			bind:preview={picturePreview}
			bind:existingImageUrl
			markedForDeletion={isPictureDeleted}
			onDeleteImage={() => {
				isPictureDeleted = true;
			}}
			onRestoreImage={() => {
				isPictureDeleted = false;
			}}
		/>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-sm">
			<FormField id="nik-edit" label="NIK" bind:value={formData.nik} placeholder="Masukkan NIK" />
			<FormField id="nis-edit" label="NIS" bind:value={formData.nis} placeholder="Masukkan NIS" />
			<FormField
				id="nisn-edit"
				label="NISN"
				bind:value={formData.nisn}
				placeholder="Masukkan NISN"
			/>
			<SelectField
				id="gender-edit"
				label="Jenis Kelamin"
				bind:value={formData.gender}
				options={[
					{ value: 'L', label: 'Laki-laki' },
					{ value: 'P', label: 'Perempuan' }
				]}
			/>
			<FormField
				id="birthplace-edit"
				label="Tempat Lahir"
				bind:value={formData.birthplace}
				placeholder="Tempat lahir"
			/>
			<FormField
				id="birthdate-edit"
				label="Tanggal Lahir"
				bind:value={formData.birthdate}
				type="date"
			/>
			<SelectField
				id="religion-edit"
				label="Agama"
				bind:value={formData.religion}
				options={[
					{ value: 'Islam', label: 'Islam' },
					{ value: 'Kristen', label: 'Kristen' },
					{ value: 'Katolik', label: 'Katolik' },
					{ value: 'Hindu', label: 'Hindu' },
					{ value: 'Buddha', label: 'Buddha' },
					{ value: 'Konghucu', label: 'Konghucu' }
				]}
			/>
			<FormField
				id="ethnic-edit"
				label="Suku"
				bind:value={formData.ethnicGroup}
				placeholder="Contoh: Jawa, Sunda"
			/>
			<FormField
				id="height-edit"
				label="Tinggi Badan (cm)"
				bind:value={formData.height}
				type="number"
			/>
			<FormField
				id="weight-edit"
				label="Berat Badan (kg)"
				bind:value={formData.weight}
				type="number"
			/>
			<FormField
				id="phone-edit"
				label="Nomor Telepon"
				bind:value={formData.phoneNumber}
				placeholder="Contoh: 0812..."
			/>
			<FormField
				id="email-edit"
				label="Email"
				bind:value={formData.email}
				type="email"
				placeholder="email@contoh.com"
			/>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-sm">
			<SelectField
				id="major-edit"
				label="Jurusan"
				bind:value={formData.currentMajorId}
				options={[{ value: '', label: 'Pilih Jurusan' }, ...majorOptions]}
			/>
			<SelectField
				id="class-edit"
				label="Kelas"
				bind:value={formData.currentClassId}
				options={[{ value: '', label: 'Pilih Kelas' }, ...classOptions]}
			/>
			<SelectField
				id="status-edit"
				label="Status"
				bind:value={formData.status}
				options={[
					{ value: 'Aktif', label: 'Aktif' },
					{ value: 'Tidak_Aktif', label: 'Tidak Aktif' },
					{ value: 'Lulus', label: 'Lulus' }
				]}
			/>
		</div>
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
	title="Hapus Data Murid"
	message={`Apakah Anda yakin ingin menghapus data murid ${selectedStudent?.fullname || selectedStudent?.name || ''}? Tindakan ini tidak dapat dibatalkan.`}
	confirmText="Ya, Hapus"
	cancelText="Batal"
	onConfirm={handleDelete}
/>

<Modal bind:isOpen={isBulkEditOpen} title="Ubah Status Masal">
	<div class="flex flex-col gap-sm">
		<p class="font-body-base text-body-base text-on-surface-variant">
			Ubah status untuk {selectedIds.length} murid yang dipilih.
		</p>
		<SelectField
			id="bulk-status-edit"
			label="Status Baru"
			bind:value={bulkStatus}
			options={[
				{ value: 'Aktif', label: 'Aktif' },
				{ value: 'Tidak_Aktif', label: 'Tidak Aktif' },
				{ value: 'Lulus', label: 'Lulus' }
			]}
		/>
	</div>
	{#snippet footer()}
		<Button
			variant="secondary"
			onclick={() => (isBulkEditOpen = false)}
			class="bg-surface text-on-surface hover:bg-surface-variant w-auto">Batal</Button
		>
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
