<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import AssignmentCard from '$lib/components/AssignmentCard.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let studentId = $derived(authState.user?.id || '');

	let allAssignments: any[] = $state([]);
	let classOptions: SelectOption[] = $state([]);
	let subjectOptions: SelectOption[] = $state([]);
	let loading = $state(true);
	let errorMsg = $state('');

	// Filter States (Murid: Kelas, Mapel, Status)
	let selectedClass = $state('all');
	let selectedSubject = $state('all');
	let selectedStatus = $state('all');

	// Pagination State
	let currentPage = $state(1);
	const itemsPerPage = 6;

	const statusOptions: SelectOption[] = [
		{ value: 'all', label: 'Semua Status' },
		{ value: 'submitted', label: 'Sudah Dikerjakan' },
		{ value: 'pending', label: 'Belum Dikerjakan' }
	];

	// Filtered Assignments
	let filteredAssignments = $derived(
		allAssignments.filter((a: any) => {
			// Filter Kelas
			if (selectedClass !== 'all' && a.classId !== selectedClass) return false;
			// Filter Mapel
			if (selectedSubject !== 'all') {
				const mapelName = a.teacher?.subjectTeachers?.[0]?.subject?.name || '';
				if (mapelName !== selectedSubject) return false;
			}
			// Filter Status (Sudah Dikerjakan vs Belum Dikerjakan)
			if (selectedStatus === 'submitted' && !a.submission) return false;
			if (selectedStatus === 'pending' && a.submission) return false;

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

	$effect(() => {
		async function fetch() {
			loading = true;
			errorMsg = '';
			try {
				const classes = await lmsStore.getStudentClasses(studentId);
				const classMap = new Map(classes.map((c) => [c.id, c.name]));
				classOptions = [
					{ value: 'all', label: 'Semua Kelas' },
					...classes.map((c) => ({ value: c.id, label: c.name }))
				];

				const tempArr: any[] = [];
				for (const cls of classes) {
					const assignments = await lmsStore.getAssignmentsByClass(cls.id);
					for (const a of assignments) {
						if (a.status !== 'Published') continue;
						const submission = await lmsStore.getMySubmission(a.id);
						tempArr.push({
							...a,
							className: classMap.get(a.classId || '') || cls.name || 'Kelas',
							submission
						});
					}
				}

				tempArr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
				allAssignments = tempArr;

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
		fetch();
	});
</script>

<svelte:head>
	<title>Semua Tugas - Akademik-BN</title>
</svelte:head>

<div class="flex justify-between items-end mb-6 mt-4">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">
			Tugas Anda
		</h2>
		<p class="font-body-md text-secondary">Kumpulan tugas yang harus Anda kerjakan.</p>
	</div>
</div>

<!-- Dropdown Filters Bar (Murid: 3 Filters - Kelas, Mapel, Status) -->
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
				<AssignmentCard
					{assignment}
					href={`/student/assignments/${assignment.id}`}
					role="student"
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
