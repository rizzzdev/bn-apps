<script lang="ts">
	import { Pagination, SearchFilter } from '$lib/components/molecules';
	import { Icon, Button, Input, ActionButton, Checkbox, Badge } from '$lib/components/atoms';
	import { Select, Modal } from '$lib/components/molecules';
import { apiClient } from '$lib/utils/api';
import { toast } from '$lib/stores/toast.svelte';
import { untrack } from 'svelte';
import { formatFullName } from '$lib/utils/helpers';
	
	let currentPage = $state(1);
	let totalPages = $state(1);
	let placements = $state<any[]>([]);
	let loading = $state(true);
	let isSubmitting = $state(false);
	
	let studentOptions = $state<{value: string, label: string}[]>([]);
	let industryOptions = $state<{value: string, label: string}[]>([]);
	let teacherOptions = $state<{value: string, label: string}[]>([]);
	let mentorOptions = $state<{value: string, label: string, companyId?: string}[]>([]);

	let selectedStudents = $state<string[]>([]);
	let selectedIndustry = $state('');
	let selectedTeacher = $state('');
	let selectedMentor = $state('');
	let selectedStatus = $state('active');
	let selectedIsAssessable = $state('false');
	let startDate = $state('');
	let durationDays = $state(90);

	let filteredMentorOptions = $derived(
		selectedIndustry ? mentorOptions.filter(m => m.companyId === selectedIndustry) : mentorOptions
	);

	let selectedRows = $state<string[]>([]);
	let isAllSelected = $state(false);

	// Modals state
	let isFormModalOpen = $state(false);
	let editId = $state<string | null>(null);

	let isDeleteModalOpen = $state(false);
	let placementToDelete = $state('');
	
	let isBulkDeleteModalOpen = $state(false);
	
	let isBulkStatusModalOpen = $state(false);
	let bulkStatusValue = $state('active');
	
	let isBulkAssessableModalOpen = $state(false);
	let bulkAssessableValue = $state('false');
	
	let searchQuery = $state("");

	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateStr));
	}

	async function fetchDropdowns() {
		const resStudents = await apiClient('/api/v1/students?limit=100');
		if (resStudents && !resStudents.error) {
			studentOptions = (resStudents.data || []).map((s: any) => ({
				value: s.id,
				label: `${s.name || s.nama} (NISN: ${s.nisn || '-'})`
			}));
		}

		const resCompanies = await apiClient('/api/v1/companies?limit=100');
		if (resCompanies && !resCompanies.error) {
			industryOptions = (resCompanies.data || []).map((c: any) => ({
				value: c.id,
				label: `${c.name || c.nama} (Sisa Kuota: ${c.remainingQuota !== undefined ? c.remainingQuota : (c.quota || 0)})`
			}));
		}

		const resTeachers = await apiClient('/api/v1/teachers?limit=100');
		if (resTeachers && !resTeachers.error) {
			teacherOptions = (resTeachers.data || []).map((t: any) => ({
				value: t.id,
				label: formatFullName(t)
			}));
		}

		const resMentors = await apiClient('/api/v1/industry-mentors?limit=100');
		if (resMentors && !resMentors.error) {
			mentorOptions = (resMentors.data || []).map((m: any) => ({
				value: m.id,
				label: `${formatFullName(m)} (${m.company?.name || 'Unknown Company'})`,
				companyId: m.companyId
			}));
		}
	}

	async function fetchPlacements(page: number) {
		loading = true;
		const currentSearch = untrack(() => searchQuery);
		const searchParam = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : "";
		const res = await apiClient(`/api/v1/internship-placements?page=${page}&limit=10${searchParam}`);
		if (res && !res.error) {
			placements = res.data || [];
			if (res.pagination) {
				totalPages = res.pagination.totalPage || 1;
				currentPage = res.pagination.currentPage || 1;
			}
		}
		loading = false;
	}

	function toggleSelectAll() {
		if (isAllSelected) {
			selectedRows = [];
		} else {
			selectedRows = placements.map(p => p.id);
		}
		isAllSelected = !isAllSelected;
	}

	function toggleRow(id: string) {
		if (selectedRows.includes(id)) {
			selectedRows = selectedRows.filter(r => r !== id);
		} else {
			selectedRows = [...selectedRows, id];
		}
		isAllSelected = selectedRows.length === placements.length && placements.length > 0;
	}

	function openAddModal() {
		editId = null;
		selectedStudents = [];
		selectedIndustry = '';
		selectedTeacher = '';
		selectedMentor = '';
		selectedStatus = 'active';
		selectedIsAssessable = 'false';
		startDate = '';
		durationDays = 90;
		isFormModalOpen = true;
	}

	function openEditModal(placement: any) {
		editId = placement.id;
		selectedStudents = [placement.studentId];
		selectedIndustry = placement.companyId || '';
		selectedTeacher = placement.teacherId || '';
		selectedMentor = placement.industryMentorId || '';
		selectedStatus = placement.status || 'active';
		selectedIsAssessable = placement.isAssessable ? 'true' : 'false';
		startDate = placement.startDate ? new Date(placement.startDate).toISOString().split('T')[0] : '';
		durationDays = placement.durationDays || 90;
		isFormModalOpen = true;
	}

	async function handleSave() {
		if (!selectedIndustry || !selectedTeacher || !selectedMentor || !startDate || !durationDays) {
			toast.error("Mohon lengkapi semua form (Industri, Guru, Mentor, Tanggal, Durasi)");
			return;
		}

		if (!editId && (!selectedStudents || selectedStudents.length === 0)) {
			toast.error("Mohon lengkapi semua form (Murid)");
			return;
		}

		isSubmitting = true;
		
		if (editId) {
			// Update single placement
			const res = await apiClient(`/api/v1/internship-placements/${editId}`, {
				method: 'PUT',
				body: JSON.stringify({
					companyId: selectedIndustry,
					teacherId: selectedTeacher,
					industryMentorId: selectedMentor,
					startDate: new Date(startDate).toISOString(),
					durationDays: Number(durationDays),
					status: selectedStatus,
					isAssessable: selectedIsAssessable === 'true'
				})
			});
			if (res && !res.error) {
				toast.success("Berhasil memperbarui data penempatan!");
				isFormModalOpen = false;
				fetchPlacements(currentPage);
				fetchDropdowns();
			} else {
				toast.error(res?.message || "Gagal memperbarui data");
			}
		} else {
			// Bulk create placements
			const res = await apiClient('/api/v1/internship-placements/bulk', {
				method: 'POST',
				body: JSON.stringify({
					studentIds: selectedStudents,
					companyId: selectedIndustry,
					teacherId: selectedTeacher,
					industryMentorId: selectedMentor,
					startDate: new Date(startDate).toISOString(),
					durationDays: Number(durationDays)
				})
			});
			if (res && !res.error) {
				toast.success(res.message || "Berhasil mengalokasikan murid!");
				isFormModalOpen = false;
				fetchPlacements(currentPage);
				fetchDropdowns();
			} else {
				toast.error(res?.message || "Gagal mengalokasikan murid");
			}
		}
		
		isSubmitting = false;
	}

	function openDeleteModal(id: string) {
		placementToDelete = id;
		isDeleteModalOpen = true;
	}

	async function executeDelete() {
		if (!placementToDelete) return;
		const res = await apiClient(`/api/v1/internship-placements/${placementToDelete}`, { method: 'DELETE' });
		if (res && !res.error) {
			toast.success("Berhasil dihapus");
			fetchPlacements(currentPage);
		} else {
			toast.error(res?.message || "Gagal menghapus");
		}
		isDeleteModalOpen = false;
		placementToDelete = '';
	}

	function openBulkDeleteModal() {
		if (selectedRows.length === 0) return toast.error("Pilih data terlebih dahulu");
		isBulkDeleteModalOpen = true;
	}

	async function executeBulkDelete() {
		const res = await apiClient('/api/v1/internship-placements/bulk-delete', {
			method: 'POST',
			body: JSON.stringify({ ids: selectedRows })
		});
		if (res && !res.error) {
			toast.success(res.message || "Data berhasil dihapus");
			selectedRows = [];
			isAllSelected = false;
			fetchPlacements(currentPage);
		} else {
			toast.error(res?.message || "Gagal menghapus");
		}
		isBulkDeleteModalOpen = false;
	}

	function openBulkStatusModal() {
		if (selectedRows.length === 0) return toast.error("Pilih data terlebih dahulu");
		isBulkStatusModalOpen = true;
	}

	async function executeBulkUpdateStatus() {
		const res = await apiClient('/api/v1/internship-placements/bulk-update-status', {
			method: 'POST',
			body: JSON.stringify({ ids: selectedRows, status: bulkStatusValue })
		});
		if (res && !res.error) {
			toast.success(res.message || "Status berhasil diubah");
			selectedRows = [];
			isAllSelected = false;
			fetchPlacements(currentPage);
		} else {
			toast.error(res?.message || "Gagal mengubah status");
		}
		isBulkStatusModalOpen = false;
	}

	function openBulkAssessableModal() {
		if (selectedRows.length === 0) return toast.error("Pilih data terlebih dahulu");
		isBulkAssessableModalOpen = true;
	}

	async function executeBulkUpdateAssessable() {
		const res = await apiClient('/api/v1/internship-placements/bulk-update-assessable', {
			method: 'POST',
			body: JSON.stringify({ ids: selectedRows, isAssessable: bulkAssessableValue === 'true' })
		});
		if (res && !res.error) {
			toast.success(res.message || "Status akses nilai berhasil diubah");
			selectedRows = [];
			isAllSelected = false;
			fetchPlacements(currentPage);
		} else {
			toast.error(res?.message || "Gagal mengubah status akses nilai");
		}
		isBulkAssessableModalOpen = false;
	}

	$effect(() => {
		fetchPlacements(currentPage);
	});

	$effect(() => {
		let isMounted = true;
		if(isMounted) fetchDropdowns();
		return () => { isMounted = false; };
	});

	$effect(() => {
		if (selectedIndustry && selectedMentor) {
			const mentor = mentorOptions.find(m => m.value === selectedMentor);
			if (mentor && mentor.companyId !== selectedIndustry) {
				selectedMentor = '';
			}
		}
	});
</script>

<svelte:head>
	<title>Kelola Penempatan | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up flex items-center justify-between">
	<div>
		<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Penempatan Magang</h2>
		<p class="font-mono text-secondary mt-1">Alokasikan murid ke Mitra Industri dan Pembimbing yang sesuai.</p>
	</div>
	<Button variant="warning" onclick={openAddModal}>
		<Icon name="add" /> Tambah Penempatan
	</Button>
</div>

<div class="mb-4 flex gap-2 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	{#if selectedRows.length > 0}
		<Button variant="error" size="sm" onclick={openBulkDeleteModal}>
			Hapus Terpilih ({selectedRows.length})
		</Button>
		<Button variant="primary" size="sm" onclick={openBulkStatusModal}>
			Ubah Status ({selectedRows.length})
		</Button>
		<Button variant="warning" size="sm" onclick={openBulkAssessableModal}>
			Ubah Akses Nilai ({selectedRows.length})
		</Button>
	{/if}
</div>

<div class="animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<SearchFilter bind:searchQuery onSearch={() => { currentPage = 1; fetchPlacements(1); }} placeholder="Cari Murid atau Mitra Industri..." />
</div>

<div class="bg-surface border-4 border-on-background shadow-neo overflow-x-auto animate-fade-in-up" style="animation-delay: 0.2s; animation-fill-mode: both;">
	<table class="w-full text-left border-collapse min-w-[800px]">
		<thead>
			<tr class="border-b-4 border-on-background bg-slate-200 font-headline font-black uppercase text-sm">
				<th class="p-4 border-r-4 border-on-background w-12 text-center">
					<Checkbox checked={isAllSelected} onchange={toggleSelectAll} />
				</th>
				<th class="p-4 border-r-4 border-on-background">Murid</th>
				<th class="p-4 border-r-4 border-on-background">Pembimbing</th>
				<th class="p-4 border-r-4 border-on-background">Mitra Industri</th>
				<th class="p-4 border-r-4 border-on-background">Periode Magang</th>
				<th class="p-4 border-r-4 border-on-background text-center">Status</th>
				<th class="p-4 text-center">Aksi</th>
			</tr>
		</thead>
		<tbody>
			{#if loading}
				<tr>
					<td colspan="6" class="p-8 text-center font-mono text-secondary">Loading...</td>
				</tr>
			{:else if placements.length === 0}
				<tr>
					<td colspan="6" class="p-8 text-center font-mono text-secondary">Tidak ada data penempatan.</td>
				</tr>
			{:else}
				{#each placements as placement}
					<tr class="border-b-4 border-on-background hover:bg-blue-50 transition-colors">
						<td class="p-4 border-r-4 border-on-background text-center">
							<Checkbox checked={selectedRows.includes(placement.id)} onchange={() => toggleRow(placement.id)} />
						</td>
						<td class="p-4 border-r-4 border-on-background font-bold">{placement.student?.name || placement.student?.nama || placement.studentId || '-'}</td>
						<td class="p-4 border-r-4 border-on-background text-sm">
							<div class="flex flex-col gap-2">
								<div class="inline-flex items-center gap-2 bg-blue-100 text-blue-900 border-2 border-blue-900 px-3 py-2 shadow-neo-sm">
									<Icon name="school" class="text-xl shrink-0" />
									<div class="flex flex-col">
										<span class="font-bold">{formatFullName(placement.teacher)}</span>
										<span class="text-[10px] uppercase font-black tracking-wider opacity-80">Guru Pendamping</span>
									</div>
								</div>
								<div class="inline-flex items-center gap-2 bg-orange-100 text-orange-900 border-2 border-orange-900 px-3 py-2 shadow-neo-sm">
									<Icon name="work" class="text-xl shrink-0" />
									<div class="flex flex-col">
										<span class="font-bold">{formatFullName(placement.industryMentor)}</span>
										<span class="text-[10px] uppercase font-black tracking-wider opacity-80">Mentor Industri</span>
									</div>
								</div>
							</div>
						</td>
						<td class="p-4 border-r-4 border-on-background font-mono text-sm">{placement.company?.name || placement.company?.nama || placement.companyId || '-'}</td>
						<td class="p-4 border-r-4 border-on-background text-sm font-mono">
							<div class="mb-1">{formatDate(placement.startDate)} - {formatDate(placement.endDate)}</div>
							<div class="text-xs text-secondary">({placement.durationDays} Hari)</div>
						</td>
						<td class="p-4 border-r-4 border-on-background text-center align-middle">
							<Badge variant={placement.status === 'active' ? 'primary' : placement.status === 'completed' ? 'secondary' : placement.status === 'cancelled' ? 'error' : 'warning'}>
								{placement.status === 'active' ? 'Aktif' : placement.status === 'completed' ? 'Selesai' : placement.status === 'cancelled' ? 'Batal' : 'Berhenti'}
							</Badge>
						</td>
						<td class="p-4 text-center">
							<div class="flex items-center justify-center gap-2">
								<ActionButton variant="secondary" icon="edit" label="Edit" onclick={() => openEditModal(placement)} />
								<ActionButton variant="error" icon="delete" label="Hapus" onclick={() => openDeleteModal(placement.id)} />
							</div>
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

<Modal bind:show={isFormModalOpen} title={editId ? "Edit Penempatan" : "Alokasi Penempatan"}>
	<div class="flex flex-col gap-4">
		<div>
			<span class="font-headline font-black uppercase text-sm block mb-2">Pilih Murid (Belum Plotting)</span>
			{#if editId}
				<div class="opacity-70 pointer-events-none">
					<Select 
						id="murid_pilih"
						options={studentOptions} 
						bind:value={selectedStudents} 
						placeholder="-- Pilih Murid --"
						multiple={true}
					/>
				</div>
				<p class="text-xs text-secondary mt-1 font-mono">* Murid tidak dapat diubah pada mode edit.</p>
			{:else}
				<Select 
					id="murid_pilih"
					options={studentOptions} 
					bind:value={selectedStudents} 
					placeholder="-- Pilih Murid --"
					multiple={true}
				/>
			{/if}
		</div>
		<div>
			<span class="font-headline font-black uppercase text-sm block mb-2">Pilih Industri (Tujuan)</span>
			<Select 
				id="industri_pilih"
				options={industryOptions} 
				bind:value={selectedIndustry} 
				placeholder="-- Pilih Mitra Industri --"
			/>
		</div>
		<div>
			<span class="font-headline font-black uppercase text-sm block mb-2">Pilih Guru Pembimbing</span>
			<Select 
				id="teacher_pilih"
				options={teacherOptions} 
				bind:value={selectedTeacher} 
				placeholder="-- Pilih Guru Pembimbing --"
			/>
		</div>
		<div>
			<span class="font-headline font-black uppercase text-sm block mb-2">Pilih Mentor Industri</span>
			<Select 
				id="mentor_pilih"
				options={filteredMentorOptions} 
				bind:value={selectedMentor} 
				placeholder="-- Pilih Mentor Industri --"
			/>
		</div>
		<div>
			<span class="font-headline font-black uppercase text-sm block mb-2">Tanggal Mulai</span>
			<Input type="date" id="start_date" bind:value={startDate} />
		</div>
		<div class="mb-4">
			<span class="font-headline font-black uppercase text-sm block mb-2">Durasi (Hari)</span>
			<input type="number" id="duration_days" bind:value={durationDays} min="1" class="w-full border-4 border-on-background bg-surface p-3 font-mono text-on-background focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all shadow-neo-sm" />
		</div>
		{#if editId}
			<div>
				<span class="font-headline font-black uppercase text-sm block mb-2">Status Penempatan</span>
				<Select 
					id="status_pilih"
					options={[
						{ value: 'active', label: 'Aktif' },
						{ value: 'completed', label: 'Selesai' },
						{ value: 'cancelled', label: 'Batal' },
						{ value: 'discontinued', label: 'Dihentikan' },
					]} 
					bind:value={selectedStatus} 
					placeholder="-- Pilih Status --"
				/>
			</div>
			<div>
				<span class="font-headline font-black uppercase text-sm block mb-2">Akses Input Nilai</span>
				<Select 
					id="is_assessable_pilih"
					options={[
						{ value: 'true', label: 'Bisa' },
						{ value: 'false', label: 'Belum' },
					]} 
					bind:value={selectedIsAssessable} 
					placeholder="-- Pilih Akses Nilai --"
				/>
			</div>
		{/if}
		
		<div class="flex justify-end gap-2 mt-4">
			<Button variant="secondary" onclick={() => isFormModalOpen = false}>Batal</Button>
			<Button variant="success" onclick={handleSave} disabled={isSubmitting}>
				{isSubmitting ? 'Memproses...' : 'Simpan'}
			</Button>
		</div>
	</div>
</Modal>

<Modal bind:show={isDeleteModalOpen} title="Konfirmasi Hapus">
	<p class="mb-6 font-mono text-sm">Apakah Anda yakin ingin menghapus data penempatan ini?</p>
	<div class="flex justify-end gap-2">
		<Button variant="secondary" onclick={() => isDeleteModalOpen = false}>Batal</Button>
		<Button variant="error" onclick={executeDelete}>Hapus</Button>
	</div>
</Modal>

<Modal bind:show={isBulkDeleteModalOpen} title="Konfirmasi Hapus Masal">
	<p class="mb-6 font-mono text-sm">Apakah Anda yakin ingin menghapus {selectedRows.length} data penempatan yang dipilih?</p>
	<div class="flex justify-end gap-2">
		<Button variant="secondary" onclick={() => isBulkDeleteModalOpen = false}>Batal</Button>
		<Button variant="error" onclick={executeBulkDelete}>Hapus Semua</Button>
	</div>
</Modal>

<Modal bind:show={isBulkStatusModalOpen} title="Ubah Status Masal">
	<p class="mb-4 font-mono text-sm">Pilih status baru untuk {selectedRows.length} data penempatan:</p>
	<div class="mb-6">
		<Select
			id="bulk_status_select"
			bind:value={bulkStatusValue}
			options={[
				{ value: 'active', label: 'Aktif' },
				{ value: 'completed', label: 'Selesai' },
				{ value: 'cancelled', label: 'Batal' },
				{ value: 'discontinued', label: 'Dihentikan' },
			]}
		/>
	</div>
	<div class="flex justify-end gap-2">
		<Button variant="secondary" onclick={() => isBulkStatusModalOpen = false}>Batal</Button>
		<Button variant="primary" onclick={executeBulkUpdateStatus}>Simpan Perubahan</Button>
	</div>
</Modal>

<Modal bind:show={isBulkAssessableModalOpen} title="Ubah Akses Nilai Masal">
	<p class="mb-4 font-mono text-sm">Pilih akses input nilai baru untuk {selectedRows.length} data penempatan:</p>
	<div class="mb-6">
		<Select
			id="bulk_assessable_select"
			bind:value={bulkAssessableValue}
			options={[
				{ value: 'true', label: 'Bisa' },
				{ value: 'false', label: 'Belum' },
			]}
		/>
	</div>
	<div class="flex justify-end gap-2">
		<Button variant="secondary" onclick={() => isBulkAssessableModalOpen = false}>Batal</Button>
		<Button variant="primary" onclick={executeBulkUpdateAssessable}>Simpan Perubahan</Button>
	</div>
</Modal>

