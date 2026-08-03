<script lang="ts">
	import { lmsStore, type Assignment } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';
	import AssignmentCard from '$lib/components/AssignmentCard.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let classMap: Record<string, string> = $state({});
	let classOptions: SelectOption[] = $state([]);
	let subjectOptions: SelectOption[] = $state([]);
	let allAssignments: Assignment[] = $state([]);
	let loading = $state(true);
	let errorMsg = $state('');

	// Filter States
	let selectedClass = $state('all');
	let selectedSubject = $state('all');
	let selectedStatus = $state('all');

	// Pagination State
	let currentPage = $state(1);
	const itemsPerPage = 6;

	let deletingId = $state<string | null>(null);
	let isDeleting = $state(false);

	const statusOptions: SelectOption[] = [
		{ value: 'all', label: 'Semua Status' },
		{ value: 'Published', label: 'Published' },
		{ value: 'Draft', label: 'Draft' }
	];

	// Filtered Assignments
	let filteredAssignments = $derived(
		allAssignments.filter((a: any) => {
			// Filter Kelas
			if (selectedClass !== 'all') {
				const inClass = a.classes?.some((c: any) => c.classId === selectedClass || c.class?.id === selectedClass);
				if (!inClass) return false;
			}
			// Filter Mapel
			if (selectedSubject !== 'all') {
				const mapelName = a.teacher?.subjectTeachers?.[0]?.subject?.name || '';
				if (mapelName !== selectedSubject) return false;
			}
			// Filter Status
			if (selectedStatus !== 'all' && a.status !== selectedStatus) return false;
			return true;
		})
	);

	// Total Pages & Paginated Items
	let totalPages = $derived(Math.ceil(filteredAssignments.length / itemsPerPage) || 1);
	let paginatedAssignments = $derived(
		filteredAssignments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	// Reset page to 1 when filters change
	$effect(() => {
		selectedClass;
		selectedSubject;
		selectedStatus;
		currentPage = 1;
	});

	async function loadAssignments() {
		loading = true;
		errorMsg = '';
		try {
			const [assignments, classes] = await Promise.all([
				lmsStore.getMyAssignments(),
				lmsStore.getTeacherClasses()
			]);
			allAssignments = assignments;

			classOptions = [
				{ value: 'all', label: 'Semua Kelas' },
				...classes.map((c) => ({ value: c.id, label: c.name }))
			];

			// Extract unique subjects for dropdown filter
			const subjectsSet = new Set<string>();
			allAssignments.forEach((a: any) => {
				const sName = a.teacher?.subjectTeachers?.[0]?.subject?.name;
				if (sName) subjectsSet.add(sName);
			});
			subjectOptions = [
				{ value: 'all', label: 'Semua Mapel' },
				...Array.from(subjectsSet).map((s) => ({ value: s, label: s }))
			];
		} catch (err: any) {
			errorMsg = err.message || 'Gagal memuat data tugas';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadAssignments();
	});

	async function handleDelete() {
		if (!deletingId) return;
		isDeleting = true;
		try {
			await lmsStore.deleteAssignment(deletingId);
			allAssignments = allAssignments.filter((a) => a.id !== deletingId);
			deletingId = null;
		} catch (err: any) {
			alert(err.message || 'Gagal menghapus tugas');
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Daftar Tugas - Akademik-BN</title>
</svelte:head>

<div class="flex justify-between items-end mb-6 mt-4">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">
			Daftar Tugas
		</h2>
		<p class="font-body-md text-secondary">Kelola tugas, draft, dan publikasi untuk kelas Anda.</p>
	</div>
	<a href="/teacher/assignments/new">
		<Button variant="primary">
			<span class="material-symbols-outlined text-sm">add</span>
			Tambah Tugas
		</Button>
	</a>
</div>

<!-- Dropdown Filters Bar (Guru: Kelas, Mapel, Status) -->
<div class="bg-surface-container neo-border p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
	<div>
		<CustomSelect
			label="Filter Kelas"
			options={classOptions}
			bind:value={selectedClass}
			placeholder="Pilih Kelas..."
		/>
	</div>
	<div>
		<CustomSelect
			label="Filter Mapel"
			options={subjectOptions}
			bind:value={selectedSubject}
			placeholder="Pilih Mapel..."
		/>
	</div>
	<div>
		<CustomSelect
			label="Filter Status"
			options={statusOptions}
			bind:value={selectedStatus}
			placeholder="Pilih Status..."
		/>
	</div>
</div>

<div class="flex flex-col gap-6">
	{#if loading}
		<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4 animate-spin">hourglass_empty</span>
			<p class="font-bold text-secondary text-lg">Memuat tugas...</p>
		</div>
	{:else if errorMsg}
		<div class="bg-surface-container p-6 neo-border text-center">
			<span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
			<p class="font-bold text-error">{errorMsg}</p>
		</div>
	{:else if filteredAssignments.length === 0}
		<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4">inbox</span>
			<p class="font-bold text-secondary text-lg">Tidak ada tugas ditemukan.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-6">
			{#each paginatedAssignments as assignment}
				{@const classNames = assignment.classes?.map((c: any) => c.class?.name).filter(Boolean).join(', ') ?? '-'}
				<AssignmentCard
					{assignment}
					href={`/teacher/assignments/${assignment.id}`}
					showStatus={true}
					role="teacher"
				/>
			{/each}
		</div>

		<!-- Pagination Component -->
		<Pagination
			{currentPage}
			{totalPages}
			totalItems={filteredAssignments.length}
			{itemsPerPage}
			onPageChange={(p) => (currentPage = p)}
		/>
	{/if}
</div>

<!-- Modal Konfirmasi Hapus -->
{#if deletingId}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-surface-container-lowest neo-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full flex flex-col gap-4">
			<h4 class="font-headline-md text-xl font-bold text-error flex items-center gap-2">
				<span class="material-symbols-outlined">warning</span>
				Hapus Tugas?
			</h4>
			<p class="font-body-md">Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.</p>
			<div class="flex justify-end items-center gap-3 mt-4">
				<Button variant="outline" disabled={isDeleting} onclick={() => (deletingId = null)}>
					Batal
				</Button>
				<Button variant="error" disabled={isDeleting} onclick={handleDelete}>
					{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
				</Button>
			</div>
		</div>
	</div>
{/if}
