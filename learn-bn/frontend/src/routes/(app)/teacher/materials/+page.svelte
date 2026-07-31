<script lang="ts">
	import { lmsStore, type Material } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';
	import MaterialCard from '$lib/components/MaterialCard.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let allMaterials: Material[] = $state([]);
	let classMap: Record<string, string> = $state({});
	let classOptions: SelectOption[] = $state([]);
	let subjectOptions: SelectOption[] = $state([]);
	let loading = $state(true);
	let errorMsg = $state('');

	// Filter States
	let selectedClass = $state('all');
	let selectedSubject = $state('all');
	let selectedStatus = $state('all');

	// Pagination State
	let currentPage = $state(1);
	const itemsPerPage = 6;

	const statusOptions: SelectOption[] = [
		{ value: 'all', label: 'Semua Status' },
		{ value: 'Published', label: 'Published' },
		{ value: 'Draft', label: 'Draft' }
	];

	// Filtered Materials
	let filteredMaterials = $derived(
		allMaterials.filter((m: any) => {
			// Filter Kelas
			if (selectedClass !== 'all') {
				const itemClassIds = m.classes && m.classes.length > 0 ? m.classes.map((c: any) => c.classId) : [m.classId];
				if (!itemClassIds.includes(selectedClass)) return false;
			}
			// Filter Mapel
			if (selectedSubject !== 'all') {
				const mapelName = m.teacher?.subjectTeachers?.[0]?.subject?.name || '';
				if (mapelName !== selectedSubject) return false;
			}
			// Filter Status
			if (selectedStatus !== 'all') {
				if (m.status !== selectedStatus) return false;
			}
			return true;
		})
	);

	// Total Pages & Paginated Items
	let totalPages = $derived(Math.ceil(filteredMaterials.length / itemsPerPage) || 1);
	let paginatedMaterials = $derived(
		filteredMaterials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
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
				const classes = await lmsStore.getTeacherClasses();
				classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));
				classOptions = [
					{ value: 'all', label: 'Semua Kelas' },
					...classes.map((c) => ({ value: c.id, label: c.name }))
				];

				const materialPromises = classes.map((c) => lmsStore.getMaterialsByClass(c.id));
				const results = await Promise.all(materialPromises);
				const flat = results.flat();
				const seen = new Set<string>();
				allMaterials = flat.filter((m) => {
					if (seen.has(m.id)) return false;
					seen.add(m.id);
					return true;
				});

				// Extract unique subjects for subject filter dropdown
				const subjectsSet = new Set<string>();
				allMaterials.forEach((m: any) => {
					const sName = m.teacher?.subjectTeachers?.[0]?.subject?.name;
					if (sName) subjectsSet.add(sName);
				});

				subjectOptions = [
					{ value: 'all', label: 'Semua Mapel' },
					...Array.from(subjectsSet).map((s) => ({ value: s, label: s }))
				];
			} catch (err: any) {
				errorMsg = err.message || 'Gagal memuat data materi';
			} finally {
				loading = false;
			}
		}
		fetch();
	});
</script>

<svelte:head>
	<title>Daftar Materi - Akademik-BN</title>
</svelte:head>

<div class="flex justify-between items-end mb-6 mt-4">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">
			Daftar Materi
		</h2>
		<p class="font-body-md text-secondary">Kelola materi pelajaran, draft, dan publikasi untuk kelas Anda.</p>
	</div>
	<a href="/teacher/materials/new">
		<Button variant="primary">
			<span class="material-symbols-outlined text-sm">add</span>
			Tambah Materi
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
			<p class="font-bold text-secondary text-lg">Memuat materi...</p>
		</div>
	{:else if errorMsg}
		<div class="bg-surface-container p-6 neo-border text-center">
			<span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
			<p class="font-bold text-error">{errorMsg}</p>
		</div>
	{:else if filteredMaterials.length === 0}
		<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4">inbox</span>
			<p class="font-bold text-secondary text-lg">Tidak ada materi ditemukan.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-6">
			{#each paginatedMaterials as mat}
				<MaterialCard material={mat} href={`/teacher/materials/${mat.id}`} showStatus={true} role="teacher" />
			{/each}
		</div>

		<!-- Pagination Component -->
		<Pagination
			{currentPage}
			{totalPages}
			totalItems={filteredMaterials.length}
			{itemsPerPage}
			onPageChange={(p) => (currentPage = p)}
		/>
	{/if}
</div>
