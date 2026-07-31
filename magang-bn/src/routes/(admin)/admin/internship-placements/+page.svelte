<script lang="ts">
	import {
		Pagination,
		SearchFilter,
		Table,
		Th,
		Td,
		Tr,
	} from "$lib/components/molecules";
	import {
		Icon,
		Button,
		Input,
		ActionButton,
		Checkbox,
		Badge,
	} from "$lib/components/atoms";
	import { Select, Modal } from "$lib/components/molecules";
	import { apiClient } from "$lib/utils/api";
	import { toast } from "$lib/stores/toast.svelte";
	import { untrack } from "svelte";
	import { formatFullName } from "$lib/utils/helpers";

	let currentPage = $state(1);
	let totalPages = $state(1);
	let placements = $state<any[]>([]);
	let loading = $state(true);
	let isSubmitting = $state(false);

	let studentOptions = $state<{ value: string; label: string }[]>([]);
	let industryOptions = $state<{ value: string; label: string }[]>([]);
	let teacherOptions = $state<{ value: string; label: string }[]>([]);
	let mentorOptions = $state<
		{ value: string; label: string; companyId?: string }[]
	>([]);

	let selectedStudents = $state<string[]>([]);
	let selectedIndustry = $state("");
	let selectedTeacher = $state("");
	let selectedMentor = $state("");
	let selectedStatus = $state("active");
	let selectedIsAssessable = $state("false");
	let startDate = $state("");
	let durationDays = $state(90);

	let filteredMentorOptions = $derived(
		selectedIndustry
			? mentorOptions.filter((m) => m.companyId === selectedIndustry)
			: mentorOptions,
	);

	let selectedRows = $state<string[]>([]);
	let isAllSelected = $state(false);

	// Modals state
	let isFormModalOpen = $state(false);
	let editId = $state<string | null>(null);

	let isDeleteModalOpen = $state(false);
	let placementToDelete = $state("");

	let isBulkDeleteModalOpen = $state(false);

	let isBulkStatusModalOpen = $state(false);
	let bulkStatusValue = $state("active");

	let isBulkAssessableModalOpen = $state(false);
	let bulkAssessableValue = $state("false");

	let searchQuery = $state("");

	// Indicator management state
	let isIndicatorModalOpen = $state(false);
	let selectedPlacementForIndicator = $state<any>(null);
	let indicators = $state<any[]>([]);
	let loadingIndicators = $state(false);
	let newIndicatorDesc = $state("");
	let indicatorError = $state("");

	function formatDate(dateStr: string) {
		if (!dateStr) return "-";
		return new Intl.DateTimeFormat("id-ID", {
			day: "numeric",
			month: "long",
			year: "numeric",
		}).format(new Date(dateStr));
	}

	async function fetchDropdowns() {
		const resStudents = await apiClient("/students?limit=1000");
		if (resStudents && !resStudents.error) {
			studentOptions = (resStudents.data || []).map((s: any) => ({
				value: s.id,
				label: `${s.name || s.fullname} (NISN: ${s.nisn || "-"})`,
			}));
		}

		const resCompanies = await apiClient("/companies?limit=1000");
		if (resCompanies && !resCompanies.error) {
			industryOptions = (resCompanies.data || []).map((c: any) => ({
				value: c.id,
				label: `${c.name || c.nama} (Sisa Kuota: ${c.remainingQuota !== undefined ? c.remainingQuota : c.quota || 0})`,
			}));
		}

		const resTeachers = await apiClient("/teachers?limit=1000");
		if (resTeachers && !resTeachers.error) {
			teacherOptions = (resTeachers.data || []).map((t: any) => ({
				value: t.id,
				label: formatFullName(t),
			}));
		}

		const resMentors = await apiClient("/industry-mentors?limit=100");
		if (resMentors && !resMentors.error) {
			mentorOptions = (resMentors.data || []).map((m: any) => ({
				value: m.id,
				label: `${formatFullName(m)} (${m.company?.name || "Unknown Company"})`,
				companyId: m.companyId,
			}));
		}
	}

	async function fetchPlacements(page: number) {
		loading = true;
		const currentSearch = untrack(() => searchQuery);
		const searchParam = currentSearch
			? `&search=${encodeURIComponent(currentSearch)}`
			: "";
		const res = await apiClient(
			`/internship-placements?page=${page}&limit=10${searchParam}`,
		);
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
			selectedRows = placements.map((p) => p.id);
		}
		isAllSelected = !isAllSelected;
	}

	function toggleRow(id: string) {
		if (selectedRows.includes(id)) {
			selectedRows = selectedRows.filter((r) => r !== id);
		} else {
			selectedRows = [...selectedRows, id];
		}
		isAllSelected =
			selectedRows.length === placements.length && placements.length > 0;
	}

	function openAddModal() {
		editId = null;
		selectedStudents = [];
		selectedIndustry = "";
		selectedTeacher = "";
		selectedMentor = "";
		selectedStatus = "active";
		selectedIsAssessable = "false";
		startDate = "";
		durationDays = 90;
		isFormModalOpen = true;
	}

	function openEditModal(placement: any) {
		editId = placement.id;
		selectedStudents = [placement.studentId];
		selectedIndustry = placement.companyId || "";
		selectedTeacher = placement.teacherId || "";
		selectedMentor = placement.industryMentorId || "";
		selectedStatus = placement.status || "active";
		selectedIsAssessable = placement.isAssessable ? "true" : "false";
		startDate = placement.startDate
			? new Date(placement.startDate).toISOString().split("T")[0]
			: "";
		durationDays = placement.durationDays || 90;
		isFormModalOpen = true;
	}

	async function handleSave() {
		if (
			!selectedIndustry ||
			!selectedTeacher ||
			!selectedMentor ||
			!startDate ||
			!durationDays
		) {
			toast.error(
				"Mohon lengkapi semua form (Industri, Guru, Mentor, Tanggal, Durasi)",
			);
			return;
		}

		if (!editId && (!selectedStudents || selectedStudents.length === 0)) {
			toast.error("Mohon lengkapi semua form (Murid)");
			return;
		}

		isSubmitting = true;

		if (editId) {
			// Update single placement
			const res = await apiClient(`/internship-placements/${editId}`, {
				method: "PUT",
				body: JSON.stringify({
					companyId: selectedIndustry,
					teacherId: selectedTeacher,
					industryMentorId: selectedMentor,
					startDate: new Date(startDate).toISOString(),
					durationDays: Number(durationDays),
					status: selectedStatus,
					isAssessable: selectedIsAssessable === "true",
				}),
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
			const res = await apiClient("/internship-placements/batch", {
				method: "POST",
				body: JSON.stringify({
					studentIds: selectedStudents,
					companyId: selectedIndustry,
					teacherId: selectedTeacher,
					industryMentorId: selectedMentor,
					startDate: new Date(startDate).toISOString(),
					durationDays: Number(durationDays),
				}),
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
		const res = await apiClient(
			`/internship-placements/${placementToDelete}`,
			{ method: "DELETE" },
		);
		if (res && !res.error) {
			toast.success("Berhasil dihapus");
			fetchPlacements(currentPage);
		} else {
			toast.error(res?.message || "Gagal menghapus");
		}
		isDeleteModalOpen = false;
		placementToDelete = "";
	}

	function openBulkDeleteModal() {
		if (selectedRows.length === 0)
			return toast.error("Pilih data terlebih dahulu");
		isBulkDeleteModalOpen = true;
	}

	async function executeBulkDelete() {
		const res = await apiClient("/internship-placements/batch/delete", {
			method: "POST",
			body: JSON.stringify({ ids: selectedRows }),
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
		if (selectedRows.length === 0)
			return toast.error("Pilih data terlebih dahulu");
		isBulkStatusModalOpen = true;
	}

	async function executeBulkUpdateStatus() {
		const res = await apiClient(
			"/internship-placements/batch/update-status",
			{
				method: "POST",
				body: JSON.stringify({
					ids: selectedRows,
					status: bulkStatusValue,
				}),
			},
		);
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
		if (selectedRows.length === 0)
			return toast.error("Pilih data terlebih dahulu");
		isBulkAssessableModalOpen = true;
	}

	async function executeBulkUpdateAssessable() {
		const res = await apiClient(
			"/internship-placements/batch/update-assessable",
			{
				method: "POST",
				body: JSON.stringify({
					ids: selectedRows,
					isAssessable: bulkAssessableValue === "true",
				}),
			},
		);
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
		if (isMounted) fetchDropdowns();
		return () => {
			isMounted = false;
		};
	});

	$effect(() => {
		if (selectedIndustry && selectedMentor) {
			const mentor = mentorOptions.find(
				(m) => m.value === selectedMentor,
			);
			if (mentor && mentor.companyId !== selectedIndustry) {
				selectedMentor = "";
			}
		}
	});

	async function openIndicatorModal(placement: any) {
		selectedPlacementForIndicator = placement;
		isIndicatorModalOpen = true;
		await fetchIndicators(placement.id);
	}

	async function fetchIndicators(placementId: string) {
		loadingIndicators = true;
		indicatorError = "";
		const res = await apiClient(`/assessment-indicators?placementId=${placementId}`);
		if (res && !res.error) {
			indicators = res.data || [];
		} else {
			indicators = [];
			indicatorError = res?.message || "Gagal mengambil data indikator";
		}
		loadingIndicators = false;
	}

	async function addIndicator() {
		if (!newIndicatorDesc.trim() || !selectedPlacementForIndicator) return;
		const res = await apiClient("/assessment-indicators", {
			method: "POST",
			body: JSON.stringify({
				placementId: selectedPlacementForIndicator.id,
				description: newIndicatorDesc.trim(),
				order: indicators.length,
			}),
		});
		if (res && !res.error) {
			newIndicatorDesc = "";
			await fetchIndicators(selectedPlacementForIndicator.id);
			toast.success("Indikator berhasil ditambahkan!");
		} else {
			toast.error(res?.message || "Gagal menambahkan indikator");
		}
	}

	async function deleteIndicator(id: string) {
		const res = await apiClient(`/assessment-indicators/${id}`, { method: "DELETE" });
		if (res && !res.error) {
			await fetchIndicators(selectedPlacementForIndicator.id);
			toast.success("Indikator berhasil dihapus!");
		} else {
			toast.error(res?.message || "Gagal menghapus indikator");
		}
	}
</script>

<svelte:head>
	<title>Kelola Penempatan | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up flex items-center justify-between">
	<div>
		<h2 class="font-headline text-xl font-black uppercase tracking-tight">
			Penempatan Magang
		</h2>
		<p class="font-mono text-secondary text-[10px] mt-1">
			Alokasikan murid ke Mitra Industri dan Pembimbing yang sesuai.
		</p>
	</div>
	<Button variant="warning" onclick={openAddModal}>
		<Icon name="add" /> Tambah Penempatan
	</Button>
</div>

<div
	class="mb-4 flex gap-2 animate-fade-in-up"
	style="animation-delay: 0.1s; animation-fill-mode: both;"
>
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

<div
	class="animate-fade-in-up"
	style="animation-delay: 0.1s; animation-fill-mode: both;"
>
	<SearchFilter
		bind:searchQuery
		onSearch={() => {
			currentPage = 1;
			fetchPlacements(1);
		}}
		placeholder="Cari Murid atau Mitra Industri..."
	/>
</div>

<Table
	{loading}
	empty={placements.length === 0}
	colSpan={7}
	emptyMessage="Tidak ada data penempatan."
>
	{#snippet header()}
		<Th variant="checkbox">
			<Checkbox checked={isAllSelected} onchange={toggleSelectAll} />
		</Th>
		<Th>Murid</Th>
		<Th>Pembimbing</Th>
		<Th>Mitra Industri</Th>
		<Th>Periode Magang</Th>
		<Th align="center">Status</Th>
		<Th variant="action" bordered={false}>Aksi</Th>
	{/snippet}
	{#each placements as placement}
		<Tr>
			<Td align="center">
				<Checkbox
					checked={selectedRows.includes(placement.id)}
					onchange={() => toggleRow(placement.id)}
				/>
			</Td>
			<Td variant="bold"
				>{placement.student?.name ||
					placement.student?.nama ||
					placement.studentId ||
					"-"}</Td
			>
			<Td>
				<div class="flex flex-col gap-2">
					<div
						class="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 border-2 border-blue-900 px-2.5 py-1 shadow-neo-sm"
					>
						<Icon name="school" class="text-xs shrink-0" />
						<div class="flex flex-col">
							<span class="font-bold font-mono text-[10px]"
								>{formatFullName(placement.teacher)}</span
							>
							<span
								class="text-[8px] uppercase font-black tracking-wider opacity-80"
								>Guru Pendamping</span
							>
						</div>
					</div>
					<div
						class="inline-flex items-center gap-1.5 bg-orange-100 text-orange-900 border-2 border-orange-900 px-2.5 py-1 shadow-neo-sm"
					>
						<Icon name="work" class="text-xs shrink-0" />
						<div class="flex flex-col">
							<span class="font-bold text-[10px] font-mono"
								>{formatFullName(
									placement.industryMentor,
								)}</span
							>
							<span
								class="text-[8px] uppercase font-black tracking-wider opacity-80"
								>Mentor Industri</span
							>
						</div>
					</div>
				</div>
			</Td>
			<Td variant="bold"
				>{placement.company?.name ||
					placement.company?.nama ||
					placement.companyId ||
					"-"}</Td
			>
			<Td variant="mono">
				<div class="mb-1">
					{formatDate(placement.startDate)} - {formatDate(
						placement.endDate,
					)}
				</div>
				<div class="text-[8px] text-secondary">
					({placement.durationDays} Hari)
				</div>
			</Td>
			<Td align="center">
				<Badge
					variant={placement.status === "active"
						? "primary"
						: placement.status === "completed"
							? "secondary"
							: placement.status === "cancelled"
								? "error"
								: "warning"}
				>
					{placement.status === "active"
						? "Aktif"
						: placement.status === "completed"
							? "Selesai"
							: placement.status === "cancelled"
								? "Batal"
								: "Berhenti"}
				</Badge>
			</Td>
			<Td variant="action" bordered={false}>
				<div class="flex items-center justify-center gap-1">
					<ActionButton
						variant="success"
						icon="checklist"
						label="Kelola Indikator"
						onclick={() => openIndicatorModal(placement)}
					/>
					<ActionButton
						variant="secondary"
						icon="edit"
						label="Edit"
						onclick={() => openEditModal(placement)}
					/>
					<ActionButton
						variant="error"
						icon="delete"
						label="Hapus"
						onclick={() => openDeleteModal(placement.id)}
					/>
				</div>
			</Td>
		</Tr>
	{/each}
</Table>

<div
	class="mt-4 flex justify-end animate-fade-in-up"
	style="animation-delay: 0.2s; animation-fill-mode: both;"
>
	<Pagination bind:currentPage {totalPages} />
</div>

<Modal
	bind:show={isFormModalOpen}
	title={editId ? "Edit Penempatan" : "Alokasi Penempatan"}
>
	<div class="flex flex-col gap-3">
		<div>
			<span
				class="font-headline font-black uppercase text-[10px] block mb-1"
				>Pilih Murid (Belum Plotting)</span
			>
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
				<p class="text-[8px] text-secondary mt-1 font-mono">
					* Murid tidak dapat diubah pada mode edit.
				</p>
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
			<span
				class="font-headline font-black uppercase text-[10px] block mb-1"
				>Pilih Industri (Tujuan)</span
			>
			<Select
				id="industri_pilih"
				options={industryOptions}
				bind:value={selectedIndustry}
				placeholder="-- Pilih Mitra Industri --"
			/>
		</div>
		<div>
			<span
				class="font-headline font-black uppercase text-[10px] block mb-1"
				>Pilih Guru Pembimbing</span
			>
			<Select
				id="teacher_pilih"
				options={teacherOptions}
				bind:value={selectedTeacher}
				placeholder="-- Pilih Guru Pembimbing --"
			/>
		</div>
		<div>
			<span
				class="font-headline font-black uppercase text-[10px] block mb-1"
				>Pilih Mentor Industri</span
			>
			<Select
				id="mentor_pilih"
				options={filteredMentorOptions}
				bind:value={selectedMentor}
				placeholder="-- Pilih Mentor Industri --"
			/>
		</div>
		<div>
			<span
				class="font-headline font-black uppercase text-[10px] block mb-1"
				>Tanggal Mulai</span
			>
			<Input type="date" id="start_date" bind:value={startDate} />
		</div>
		<div class="mb-3">
			<span
				class="font-headline font-black uppercase text-[10px] block mb-1"
				>Durasi (Hari)</span
			>
			<input
				type="number"
				id="duration_days"
				bind:value={durationDays}
				min="1"
				class="w-full border-2 border-on-background bg-surface p-2 font-mono text-[10px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-neo-sm"
			/>
		</div>
		{#if editId}
			<div>
				<span
					class="font-headline font-black uppercase text-[10px] block mb-2"
					>Status Penempatan</span
				>
				<Select
					id="status_pilih"
					options={[
						{ value: "active", label: "Aktif" },
						{ value: "completed", label: "Selesai" },
						{ value: "cancelled", label: "Batal" },
						{ value: "discontinued", label: "Dihentikan" },
					]}
					bind:value={selectedStatus}
					placeholder="-- Pilih Status --"
				/>
			</div>
			<div>
				<span
					class="font-headline font-black uppercase text-[10px] block mb-2"
					>Akses Input Nilai</span
				>
				<Select
					id="is_assessable_pilih"
					options={[
						{ value: "true", label: "Bisa" },
						{ value: "false", label: "Belum" },
					]}
					bind:value={selectedIsAssessable}
					placeholder="-- Pilih Akses Nilai --"
				/>
			</div>
		{/if}

		<div class="flex justify-end gap-1 mt-3">
			<Button
				variant="secondary"
				onclick={() => (isFormModalOpen = false)}>Batal</Button
			>
			<Button
				variant="success"
				onclick={handleSave}
				disabled={isSubmitting}
			>
				{isSubmitting ? "Memproses..." : "Simpan"}
			</Button>
		</div>
	</div>
</Modal>

<Modal bind:show={isDeleteModalOpen} title="Konfirmasi Hapus">
	<p class="mb-4 font-mono text-[10px]">
		Apakah Anda yakin ingin menghapus data penempatan ini?
	</p>
	<div class="flex justify-end gap-1">
		<Button variant="secondary" onclick={() => (isDeleteModalOpen = false)}
			>Batal</Button
		>
		<Button variant="error" onclick={executeDelete}>Hapus</Button>
	</div>
</Modal>

<Modal bind:show={isBulkDeleteModalOpen} title="Konfirmasi Hapus Masal">
	<p class="mb-4 font-mono text-[10px]">
		Apakah Anda yakin ingin menghapus {selectedRows.length} data penempatan yang
		dipilih?
	</p>
	<div class="flex justify-end gap-1">
		<Button
			variant="secondary"
			onclick={() => (isBulkDeleteModalOpen = false)}>Batal</Button
		>
		<Button variant="error" onclick={executeBulkDelete}>Hapus Semua</Button>
	</div>
</Modal>

<Modal bind:show={isBulkStatusModalOpen} title="Ubah Status Masal">
	<p class="mb-3 font-mono text-[10px]">
		Pilih status baru untuk {selectedRows.length} data penempatan:
	</p>
	<div class="mb-6">
		<Select
			id="bulk_status_select"
			bind:value={bulkStatusValue}
			options={[
				{ value: "active", label: "Aktif" },
				{ value: "completed", label: "Selesai" },
				{ value: "cancelled", label: "Batal" },
				{ value: "discontinued", label: "Dihentikan" },
			]}
		/>
	</div>
	<div class="flex justify-end gap-1">
		<Button
			variant="secondary"
			onclick={() => (isBulkStatusModalOpen = false)}>Batal</Button
		>
		<Button variant="primary" onclick={executeBulkUpdateStatus}
			>Simpan Perubahan</Button
		>
	</div>
</Modal>	<Modal bind:show={isBulkAssessableModalOpen} title="Ubah Akses Nilai Masal">
	<p class="mb-3 font-mono text-[10px]">
		Pilih akses input nilai baru untuk {selectedRows.length} data penempatan:
	</p>
	<div class="mb-6">
		<Select
			id="bulk_assessable_select"
			bind:value={bulkAssessableValue}
			options={[
				{ value: "true", label: "Bisa" },
				{ value: "false", label: "Belum" },
			]}
		/>
	</div>
	<div class="flex justify-end gap-1">
		<Button
			variant="secondary"
			onclick={() => (isBulkAssessableModalOpen = false)}>Batal</Button
		>
		<Button variant="primary" onclick={executeBulkUpdateAssessable}
			>Simpan Perubahan</Button
		>
	</div>
</Modal>

<!-- Indicator Management Modal -->
<Modal bind:show={isIndicatorModalOpen} title="Kelola Indikator Keberhasilan">
	{#if selectedPlacementForIndicator}
		<div class="mb-3">
			<div class="flex items-center gap-2 mb-2">
				<span class="font-mono text-[10px] text-secondary">
					Murid: <span class="font-bold text-on-background">{selectedPlacementForIndicator.student?.name || "-"}</span>
				</span>
				<span class="font-mono text-[10px] text-secondary">
					Industri: <span class="font-bold text-on-background">{selectedPlacementForIndicator.company?.name || "-"}</span>
				</span>
			</div>
		</div>

		<!-- Add new indicator -->
		<div class="flex gap-2 mb-4">
			<input
				type="text"
				bind:value={newIndicatorDesc}
				onkeydown={(e) => { if (e.key === 'Enter') addIndicator(); }}
				placeholder="Masukkan deskripsi indikator..."
				class="flex-1 border-2 border-on-background bg-surface p-2 font-mono text-[10px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-neo-sm"
			/>
			<Button variant="success" size="sm" onclick={addIndicator} disabled={!newIndicatorDesc.trim()}>
				<Icon name="add" class="text-xs" /> Tambah
			</Button>
		</div>

		<!-- List of indicators -->
		<div class="border-2 border-on-background max-h-[300px] overflow-y-auto">
			{#if loadingIndicators}
				<div class="flex items-center justify-center p-4">
					<Icon name="sync" class="text-lg animate-spin text-primary" />
				</div>
			{:else if indicatorError}
				<div class="p-3 text-center">
					<p class="font-mono text-[10px] text-error">{indicatorError}</p>
				</div>
			{:else if indicators.length === 0}
				<div class="p-4 text-center">
					<p class="font-mono text-[10px] text-secondary">Belum ada indikator keberhasilan.</p>
					<p class="font-mono text-[9px] text-secondary mt-1">Tambahkan indikator untuk memulai penilaian berbasis indikator.</p>
				</div>
			{:else}
				{#each indicators as indicator, idx}
					<div class="flex items-center justify-between px-3 py-2 border-b border-on-background last:border-b-0 hover:bg-slate-50 transition-colors">
						<div class="flex items-center gap-2">
							<span class="font-mono text-[10px] font-bold text-primary">#{idx + 1}</span>
							<span class="font-mono text-[10px] text-on-background">{indicator.description}</span>
						</div>
						<button
							onclick={() => deleteIndicator(indicator.id)}
							class="text-error hover:bg-error/10 p-1 transition-colors"
							title="Hapus indikator"
						>
							<Icon name="delete" class="text-xs" />
						</button>
					</div>
				{/each}
			{/if}
		</div>

		<div class="mt-3 flex justify-end">
			<Button variant="secondary" onclick={() => (isIndicatorModalOpen = false)}>Tutup</Button>
		</div>
	{/if}
</Modal>
