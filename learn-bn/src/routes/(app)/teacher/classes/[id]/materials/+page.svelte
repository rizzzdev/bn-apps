<script lang="ts">
	import { page } from '$app/stores';
	import { lmsStore, type Material } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';
	import MaterialCard from '$lib/components/MaterialCard.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let classId = $derived($page.params.id as string);

	let materials = $state<Material[]>([]);
	let loading = $state(true);
	let errorMsg = $state('');

	// Filter states
	let selectedSubject = $state('all');
	let selectedStatus = $state('all');
	let subjectOptions = $state<SelectOption[]>([]);

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 5;

	async function loadMaterials() {
		loading = true;
		errorMsg = '';
		try {
			const res = await lmsStore.getMaterialsByClass(classId);
			materials = res;

			// Extract unique subjects
			const subjectMap = new Map<string, string>();
			for (const m of res) {
				if (m.teacher?.subjectTeachers) {
					for (const st of m.teacher.subjectTeachers) {
						if (st.subject?.id && st.subject?.name) {
							subjectMap.set(st.subject.id, st.subject.name);
						}
					}
				}
			}
			subjectOptions = [
				{ label: 'Semua Mapel', value: 'all' },
				...Array.from(subjectMap.entries()).map(([id, name]) => ({ label: name, value: id }))
			];
		} catch (err: any) {
			errorMsg = err.message || 'Gagal memuat materi';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadMaterials();
	});

	let statusOptions: SelectOption[] = [
		{ label: 'Semua Status', value: 'all' },
		{ label: 'Published', value: 'Published' },
		{ label: 'Draft', value: 'Draft' }
	];

	let filteredMaterials = $derived(
		materials.filter((m) => {
			if (selectedStatus !== 'all' && m.status !== selectedStatus) return false;
			if (selectedSubject !== 'all') {
				const hasSub = m.teacher?.subjectTeachers?.some((st) => st.subject?.id === selectedSubject);
				if (!hasSub) return false;
			}
			return true;
		})
	);

	let totalPages = $derived(Math.ceil(filteredMaterials.length / itemsPerPage) || 1);
	let paginatedMaterials = $derived(
		filteredMaterials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);
</script>

<svelte:head>
	<title>Materi Kelas - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex justify-between items-center">
		<h3 class="font-headline-md text-xl font-bold flex items-center gap-2">
			<span class="material-symbols-outlined text-2xl">menu_book</span>
			Materi Kelas
		</h3>
		<a href={`/teacher/materials/new?classId=${classId}`}>
			<Button variant="primary">
				<span class="material-symbols-outlined text-sm">add</span>
				Buat Materi
			</Button>
		</a>
	</div>

	<!-- Filter Options -->
	<div class="bg-surface-container neo-border p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
		<CustomSelect
			label="Filter Mapel"
			options={subjectOptions}
			bind:value={selectedSubject}
			placeholder="Pilih Mapel..."
		/>
		<CustomSelect
			label="Filter Status"
			options={statusOptions}
			bind:value={selectedStatus}
			placeholder="Pilih Status..."
		/>
	</div>

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
			<p class="font-bold text-secondary text-lg">Belum ada materi untuk kelas ini.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-6">
			{#each paginatedMaterials as mat}
				<MaterialCard material={mat} href={`/teacher/materials/${mat.id}`} showStatus={true} role="teacher" />
			{/each}
		</div>

		<Pagination
			{currentPage}
			{totalPages}
			totalItems={filteredMaterials.length}
			{itemsPerPage}
			onPageChange={(p) => (currentPage = p)}
		/>
	{/if}
</div>
