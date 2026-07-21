<script lang="ts">
	import { Pagination, Modal, FormField, ConfirmationModal, SearchFilter, MapInput, MapViewer } from '$lib/components/molecules';
	import { Icon, Button, ActionButton, Checkbox } from '$lib/components/atoms';
	import { apiClient } from '$lib/utils/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { read, utils } from 'xlsx';
	import { onMount, untrack } from 'svelte';

	let currentPage = $state(1);
	let totalPages = $state(1);
	let companies = $state<any[]>([]);
	let loading = $state(true);

	// Selection
	let selectedIds = $state<string[]>([]);
	let selectAll = $state(false);

	// Form Modal
	let showFormModal = $state(false);
	let formMode = $state<'create' | 'edit'>('create');
	let isSubmitting = $state(false);

	let formId = $state('');
	let formName = $state('');
	let formAddress = $state('');
	let formContactPerson = $state('');
	let formPhone = $state('');
	let formQuota = $state(0);
	let formCheckInTime = $state('');
	let formCheckOutTime = $state('');
	let formLocationMetadata = $state<{latitude: number; longitude: number} | null>(null);

	let showDetailModal = $state(false);
	let selectedCompanyDetail = $state<any>(null);

	// Import Modal
	let showImportModal = $state(false);
	let importFile = $state<File | null>(null);
	let previewData = $state<any[]>([]);
	let isImporting = $state(false);
	let fileInput = $state<HTMLInputElement>();

	// Delete
	let showDeleteConfirm = $state(false);
	let itemToDelete = $state('');
	let showBulkDeleteConfirm = $state(false);
	let searchQuery = $state("");

	async function fetchCompanies(page: number) {
		loading = true;
		const currentSearch = untrack(() => searchQuery);
		const searchParam = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : "";
		const res = await apiClient(`/api/v1/companies?page=${page}&limit=10${searchParam}`);
		if (res && !res.error) {
			companies = res.data || [];
			if (res.pagination) {
				totalPages = res.pagination.totalPage || 1;
				currentPage = res.pagination.currentPage || 1;
			}
		} else {
			companies = [];
			totalPages = 1;
		}
		// Reset selection
		selectedIds = [];
		selectAll = false;
		loading = false;
	}

	function handleSelectAll(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.checked) {
			selectedIds = companies.map(c => c.id);
		} else {
			selectedIds = [];
		}
	}

	function toggleSelection(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter(i => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	$effect(() => {
		if (companies.length > 0 && selectedIds.length === companies.length) {
			selectAll = true;
		} else {
			selectAll = false;
		}
	});

	function openCreateModal() {
		formMode = 'create';
		formId = '';
		formName = '';
		formAddress = '';
		formContactPerson = '';
		formPhone = '';
		formQuota = 0;
		formCheckInTime = '';
		formCheckOutTime = '';
		formLocationMetadata = null;
		showFormModal = true;
	}

	function openEditModal(company: any) {
		formMode = 'edit';
		formId = company.id;
		formName = company.name || '';
		formAddress = company.address || '';
		formContactPerson = company.contactPerson || '';
		formPhone = company.phone || '';
		formQuota = company.quota || 0;
		formCheckInTime = company.checkInTime || '';
		formCheckOutTime = company.checkOutTime || '';
		formLocationMetadata = company.locationMetadata ? (typeof company.locationMetadata === 'string' ? JSON.parse(company.locationMetadata) : company.locationMetadata) : null;
		showFormModal = true;
	}

	function openDetailModal(company: any) {
		selectedCompanyDetail = company;
		showDetailModal = true;
	}

	async function handleSaveForm() {
		if (!formName.trim()) {
			toast.error("Nama perusahaan wajib diisi!");
			return;
		}

		isSubmitting = true;
		const payload = {
			name: formName,
			address: formAddress,
			contactPerson: formContactPerson,
			phone: formPhone,
			quota: Number(formQuota),
			checkInTime: formCheckInTime || null,
			checkOutTime: formCheckOutTime || null,
			locationMetadata: formLocationMetadata
		};

		let endpoint = '/api/v1/companies';
		let method = 'POST';

		if (formMode === 'edit') {
			endpoint = `/api/v1/companies/${formId}`;
			method = 'PUT';
		}

		const res = await apiClient(endpoint, {
			method,
			body: JSON.stringify(payload)
		});

		isSubmitting = false;

		if (res && !res.error) {
			toast.success(formMode === 'create' ? "Perusahaan berhasil ditambahkan!" : "Perusahaan berhasil diperbarui!");
			showFormModal = false;
			fetchCompanies(currentPage);
		} else {
			toast.error(res?.message || "Gagal menyimpan data");
		}
	}

	function confirmDelete(id: string) {
		itemToDelete = id;
		showDeleteConfirm = true;
	}

	async function handleDelete() {
		showDeleteConfirm = false;
		const res = await apiClient(`/api/v1/companies/${itemToDelete}`, { method: 'DELETE' });
		if (res && !res.error) {
			toast.success("Perusahaan berhasil dihapus!");
			if (companies.length === 1 && currentPage > 1) currentPage--;
			fetchCompanies(currentPage);
		} else {
			toast.error(res?.message || "Gagal menghapus perusahaan");
		}
	}

	function confirmBulkDelete() {
		if (selectedIds.length === 0) return;
		showBulkDeleteConfirm = true;
	}

	async function handleBulkDelete() {
		showBulkDeleteConfirm = false;
		const res = await apiClient(`/api/v1/companies/bulk-delete`, {
			method: 'POST',
			body: JSON.stringify({ ids: selectedIds })
		});
		if (res && !res.error) {
			toast.success(`Berhasil menghapus ${selectedIds.length} perusahaan!`);
			selectedIds = [];
			fetchCompanies(currentPage);
		} else {
			toast.error(res?.message || "Gagal menghapus data masal");
		}
	}

	async function downloadTemplate() {
		try {
			// Using fetch directly because we need binary response for excel
			let accessToken = '';
			const tokenMatch = document.cookie.match(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/);
			if (tokenMatch && tokenMatch[1]) accessToken = tokenMatch[1];
			
			// We might need to construct PUBLIC_API_URL or use a relative path if proxy is set up
			// apiClient uses relative endpoints when proxy is configured, or absolute otherwise.
			// The simplest way to download is just creating an anchor tag or using fetch + blob
			const res = await fetch(`${PUBLIC_API_URL}/api/v1/companies/excel/template`, {
				headers: { 'Authorization': `Bearer ${accessToken}` }
			});
			
			if (res.ok) {
				const blob = await res.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'template-company.xlsx';
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				a.remove();
			} else {
				toast.error("Gagal mendownload template");
			}
		} catch (e) {
			toast.error("Terjadi kesalahan saat mendownload template");
		}
	}

	async function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			importFile = target.files[0];

			try {
				const data = await importFile.arrayBuffer();
				const workbook = read(data);
				const sheet = workbook.Sheets[workbook.SheetNames[0]];
				const rows: any[] = utils.sheet_to_json(sheet);
				
				previewData = rows.map(row => ({
					name: row['Nama Perusahaan']?.toString().trim() || '',
					address: row['Alamat']?.toString() || null,
					contactPerson: row['PIC']?.toString() || null,
					phone: row['No. HP']?.toString() || null,
					quota: row['Kuota Magang'] ? Number(row['Kuota Magang']) : 0
				})).filter(row => row.name);

				if (previewData.length === 0) {
					toast.error("Format tidak sesuai atau data kosong");
					importFile = null;
				}
			} catch (err) {
				toast.error("Gagal membaca file excel");
				importFile = null;
			}
		}
	}

	async function handleImport() {
		if (previewData.length === 0) {
			toast.error("Tidak ada data untuk diimpor");
			return;
		}

		isImporting = true;

		const res = await apiClient('/api/v1/companies/bulk', {
			method: 'POST',
			body: JSON.stringify(previewData)
		});

		isImporting = false;
		if (res && !res.error) {
			toast.success(res.message || "Berhasil mengimpor data");
			showImportModal = false;
			importFile = null;
			previewData = [];
			fetchCompanies(currentPage);
		} else {
			toast.error(res?.message || "Gagal mengimpor data");
		}
	}

	$effect(() => {
		fetchCompanies(currentPage);
	});
</script>

<svelte:head>
	<title>Kelola Industri | Magang-BN</title>
</svelte:head>

<div class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-6 animate-fade-in-up">
	<div>
		<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Data Mitra Industri</h2>
		<p class="font-mono text-secondary mt-1">Daftar Dunia Usaha & Dunia Industri (Perusahaan Mitra).</p>
	</div>
	<div class="flex flex-wrap gap-2">
		{#if selectedIds.length > 0}
			<Button variant="error" onclick={confirmBulkDelete}>
				<Icon name="delete_sweep" />
				<span>Hapus {selectedIds.length} Terpilih</span>
			</Button>
		{/if}
		<Button variant="success" onclick={() => showImportModal = true}>
			<Icon name="upload_file" />
			<span>Import</span>
		</Button>
		<Button variant="warning" onclick={openCreateModal}>
			<Icon name="domain_add" />
			<span>Tambah Industri</span>
		</Button>
	</div>
</div>

<div class="animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<SearchFilter bind:searchQuery onSearch={() => { currentPage = 1; fetchCompanies(1); }} placeholder="Cari Mitra Industri..." />
</div>

<div class="bg-surface border-4 border-on-background shadow-neo overflow-x-auto animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
	<table class="w-full text-left border-collapse min-w-[1000px]">
		<thead>
			<tr class="border-b-4 border-on-background bg-slate-100 font-headline font-black uppercase text-sm">
				<th class="p-4 border-r-4 border-on-background w-12 text-center align-middle">
					<Checkbox bind:checked={selectAll} onchange={handleSelectAll} />
				</th>
				<th class="p-4 border-r-4 border-on-background">Nama Perusahaan</th>
				<th class="p-4 border-r-4 border-on-background">PIC</th>
				<th class="p-4 border-r-4 border-on-background">Jam Operasional</th>
				<th class="p-4 text-center">Aksi</th>
			</tr>
		</thead>
		<tbody>
			{#if loading}
				<tr>
					<td colspan="5" class="p-8 text-center font-mono text-secondary">Loading...</td>
				</tr>
			{:else if companies.length === 0}
				<tr>
					<td colspan="5" class="p-8 text-center font-mono text-secondary">Tidak ada data Industri.</td>
				</tr>
			{:else}
				{#each companies as company}
					<tr class="border-b-4 border-on-background hover:bg-blue-50 transition-colors {selectedIds.includes(company.id) ? 'bg-blue-100' : ''}">
						<td class="p-4 border-r-4 border-on-background text-center align-middle">
							<Checkbox checked={selectedIds.includes(company.id)} onchange={() => toggleSelection(company.id)} />
						</td>
						<td class="p-4 border-r-4 border-on-background font-bold text-lg">{company.name || '-'}</td>
						<td class="p-4 border-r-4 border-on-background">
							<div class="font-bold text-base">{company.contactPerson || '-'}</div>
							<div class="inline-flex items-center gap-1 bg-surface border-2 border-on-background px-2 py-0.5 mt-1 shadow-[2px_2px_0px_0px_#0f172a]">
								<Icon name="phone" class="text-[10px]" />
								<span class="text-xs font-mono font-bold tracking-tight">{company.phone || '-'}</span>
							</div>
						</td>
						<td class="p-4 border-r-4 border-on-background">
							{#if company.checkInTime && company.checkOutTime}
								<div class="text-sm font-mono flex items-center gap-1 bg-slate-100 border-2 border-on-background px-2 py-1 shadow-neo-sm w-fit">
									<Icon name="schedule" class="text-[14px]" />
									{company.checkInTime} - {company.checkOutTime}
								</div>
							{:else}
								<span class="text-secondary font-mono text-sm">-</span>
							{/if}
						</td>
						<td class="p-4 text-center flex justify-center gap-2">
							<ActionButton variant="primary" icon="visibility" label="Detail" onclick={() => openDetailModal(company)} />
							<ActionButton variant="secondary" icon="edit" label="Edit" onclick={() => openEditModal(company)} />
							<ActionButton variant="error" icon="delete" label="Hapus" onclick={() => confirmDelete(company.id)} />
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<div class="mt-6 flex justify-end animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
	<Pagination bind:currentPage {totalPages} />
</div>

<!-- Form Modal -->
<Modal bind:show={showFormModal} title={formMode === 'create' ? 'Tambah Industri' : 'Edit Industri'}>
	<div class="space-y-4 font-mono">
		<FormField id="company-name" label="Nama Perusahaan *">
			<input type="text" id="company-name" bind:value={formName} placeholder="PT Maju Mundur" class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm" />
		</FormField>
		<FormField id="company-address" label="Alamat Lengkap">
			<textarea id="company-address" bind:value={formAddress} placeholder="Jl. Raya..." class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm min-h-[100px]"></textarea>
		</FormField>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<FormField id="company-cp" label="Kontak Person">
				<input type="text" id="company-cp" bind:value={formContactPerson} placeholder="Budi Santoso" class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm" />
			</FormField>
			<FormField id="company-phone" label="No. Telepon">
				<input type="tel" id="company-phone" bind:value={formPhone} placeholder="08123456789" class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm" />
			</FormField>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<FormField id="company-checkin" label="Jam Masuk (Opsional)">
				<input type="time" id="company-checkin" bind:value={formCheckInTime} class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm" />
			</FormField>
			<FormField id="company-checkout" label="Jam Pulang (Opsional)">
				<input type="time" id="company-checkout" bind:value={formCheckOutTime} class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm" />
			</FormField>
		</div>
		<FormField id="company-quota" label="Kuota Penerimaan">
			<input type="number" id="company-quota" bind:value={formQuota} placeholder="0" class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm" />
		</FormField>
		<FormField id="company-location" label="Titik Lokasi Peta (Opsional)">
			<MapInput bind:location={formLocationMetadata} />
		</FormField>
		
		<div class="pt-4 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => showFormModal = false}>Batal</Button>
			<Button variant="success" onclick={handleSaveForm} disabled={isSubmitting}>
				{#if isSubmitting}
					Menyimpan...
				{:else}
					<Icon name="save" />
					<span>Simpan</span>
				{/if}
			</Button>
		</div>
	</div>
</Modal>

<!-- Import Modal -->
<Modal bind:show={showImportModal} title={previewData.length > 0 ? "Pratinjau Data Industri" : "Import Excel Industri"}>
	<div class="space-y-4 font-mono">
		{#if previewData.length === 0}
			<div class="flex justify-between items-center bg-slate-100 border-4 border-on-background p-4 shadow-neo-sm">
				<p class="text-sm font-bold">Butuh format datanya?</p>
				<Button variant="secondary" size="sm" onclick={downloadTemplate}>
					<Icon name="download" class="text-sm" /> Download Template
				</Button>
			</div>
			
			<div class="border-4 border-dashed border-on-background p-8 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer mt-4" onclick={() => fileInput?.click()} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && fileInput?.click()} aria-label="Upload file excel">
				<Icon name="cloud_upload" class="text-4xl text-secondary mb-2" />
				<p class="font-bold">{importFile ? importFile.name : 'Klik untuk memilih file excel'}</p>
				<input type="file" accept=".xlsx, .xls" class="hidden" bind:this={fileInput} onchange={handleFileSelect} />
			</div>
		{:else}
			<div class="max-h-[300px] overflow-y-auto overflow-x-auto border-4 border-on-background shadow-neo-sm">
				<table class="w-full text-left border-collapse text-sm">
					<thead class="sticky top-0 bg-slate-100 border-b-4 border-on-background">
						<tr>
							<th class="p-2 border-r-4 border-on-background">Perusahaan</th>
							<th class="p-2 border-r-4 border-on-background">PIC</th>
							<th class="p-2">Kuota</th>
						</tr>
					</thead>
					<tbody>
						{#each previewData as row}
							<tr class="border-b-4 border-on-background last:border-b-0">
								<td class="p-2 border-r-4 border-on-background truncate max-w-[150px]">{row.name}</td>
								<td class="p-2 border-r-4 border-on-background truncate max-w-[150px]">{row.contactPerson || '-'}</td>
								<td class="p-2 truncate max-w-[50px]">{row.quota}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="text-sm font-bold text-secondary text-right mt-2">
				Total: {previewData.length} data valid
			</p>
		{/if}

		<div class="pt-4 flex justify-end gap-2">
			<Button variant="secondary" onclick={() => {
				showImportModal = false;
				importFile = null;
				previewData = [];
			}}>Batal</Button>
			<Button variant="success" onclick={handleImport} disabled={isImporting || previewData.length === 0}>
				{#if isImporting}
					Menyimpan...
				{:else}
					<Icon name="save" />
					<span>Konfirmasi Simpan</span>
				{/if}
			</Button>
		</div>
	</div>
</Modal>

<!-- Detail Modal -->
<Modal bind:show={showDetailModal} title="Detail Mitra Industri">
	{#if selectedCompanyDetail}
		<div class="space-y-4">
			<div class="border-4 border-on-background bg-slate-100 p-4 shadow-neo-sm">
				<h3 class="font-headline font-black text-2xl mb-1">{selectedCompanyDetail.name}</h3>
				<p class="font-mono text-sm mb-4">{selectedCompanyDetail.address || '-'}</p>
				
				<div class="grid grid-cols-2 gap-4 font-mono text-sm border-t-2 border-on-background pt-4">
					<div>
						<span class="block font-bold text-secondary text-xs uppercase mb-1">Kontak Person</span>
						<div>{selectedCompanyDetail.contactPerson || '-'}</div>
						<div class="text-secondary flex items-center gap-1 mt-1"><Icon name="phone" class="text-xs" /> {selectedCompanyDetail.phone || '-'}</div>
					</div>
					<div>
						<span class="block font-bold text-secondary text-xs uppercase mb-1">Jam Operasional</span>
						{#if selectedCompanyDetail.checkInTime && selectedCompanyDetail.checkOutTime}
							<div class="flex items-center gap-1"><Icon name="schedule" class="text-xs" /> {selectedCompanyDetail.checkInTime} - {selectedCompanyDetail.checkOutTime}</div>
						{:else}
							-
						{/if}
					</div>
					<div>
						<span class="block font-bold text-secondary text-xs uppercase mb-1">Total Kuota</span>
						<span class="bg-primary text-on-background px-2 py-0.5 border-2 border-on-background font-bold">{selectedCompanyDetail.quota || 0}</span>
					</div>
					<div>
						<span class="block font-bold text-secondary text-xs uppercase mb-1">Sisa Kuota</span>
						<span class="{(selectedCompanyDetail.remainingQuota !== undefined ? selectedCompanyDetail.remainingQuota : selectedCompanyDetail.quota) > 0 ? 'bg-success' : 'bg-error text-surface'} text-on-background px-2 py-0.5 border-2 border-on-background font-bold">
							{selectedCompanyDetail.remainingQuota !== undefined ? selectedCompanyDetail.remainingQuota : (selectedCompanyDetail.quota || 0)}
						</span>
					</div>
				</div>
			</div>

			{#if selectedCompanyDetail.locationMetadata}
				<div class="mt-4 border-4 border-on-background shadow-neo-sm">
					<div class="bg-slate-200 border-b-4 border-on-background px-4 py-2 font-headline font-black text-sm uppercase">Peta Lokasi</div>
					<div class="p-2">
						<MapViewer location={typeof selectedCompanyDetail.locationMetadata === 'string' ? JSON.parse(selectedCompanyDetail.locationMetadata) : selectedCompanyDetail.locationMetadata} />
					</div>
				</div>
			{:else}
				<div class="mt-4 p-4 border-4 border-on-background bg-slate-100 shadow-neo-sm text-center font-mono text-sm text-secondary">
					Belum ada titik lokasi peta.
				</div>
			{/if}

			<div class="pt-4 flex justify-end">
				<Button variant="secondary" onclick={() => showDetailModal = false}>Tutup</Button>
			</div>
		</div>
	{/if}
</Modal>

<ConfirmationModal 
	bind:show={showDeleteConfirm} 
	title="Hapus Perusahaan" 
	message="Apakah Anda yakin ingin menghapus perusahaan ini? Semua data penempatan yang terkait mungkin akan ikut terpengaruh." 
	type="danger"
	confirmText="Ya, Hapus"
	onConfirm={handleDelete} 
/>

<ConfirmationModal 
	bind:show={showBulkDeleteConfirm} 
	title="Hapus Masal" 
	message="Apakah Anda yakin ingin menghapus {selectedIds.length} perusahaan terpilih? Tindakan ini tidak dapat dibatalkan." 
	type="danger"
	confirmText="Ya, Hapus Semua"
	onConfirm={handleBulkDelete} 
/>
