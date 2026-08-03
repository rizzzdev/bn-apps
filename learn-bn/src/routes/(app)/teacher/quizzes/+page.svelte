<script lang="ts">
	import { lmsStore, type Quiz } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import QuizCard from '$lib/components/QuizCard.svelte';

	let classMap: Record<string, string> = $state({});
	let classOptions: SelectOption[] = $state([]);
	let subjectOptions: SelectOption[] = $state([]);
	let allQuizzes: Quiz[] = $state([]);
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

	// Filtered Quizzes
	let filteredQuizzes = $derived(
		allQuizzes.filter((q: any) => {
			// Filter Kelas
			if (selectedClass !== 'all' && q.classId !== selectedClass) return false;
			// Filter Mapel
			if (selectedSubject !== 'all') {
				const mapelName = q.teacher?.subjectTeachers?.[0]?.subject?.name || '';
				if (mapelName !== selectedSubject) return false;
			}
			// Filter Status
			if (selectedStatus !== 'all' && q.status !== selectedStatus) return false;
			return true;
		})
	);

	// Total Pages & Paginated Items
	let totalPages = $derived(Math.ceil(filteredQuizzes.length / itemsPerPage) || 1);
	let paginatedQuizzes = $derived(
		filteredQuizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	// Reset page to 1 when filters change
	$effect(() => {
		selectedClass;
		selectedSubject;
		selectedStatus;
		currentPage = 1;
	});

	async function loadQuizzes() {
		loading = true;
		errorMsg = '';
		try {
			const classes = await lmsStore.getTeacherClasses();
			classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));
			classOptions = [
				{ value: 'all', label: 'Semua Kelas' },
				...classes.map((c) => ({ value: c.id, label: c.name }))
			];

			const quizPromises = classes.map((c) => lmsStore.getQuizzesByClass(c.id));
			const results = await Promise.all(quizPromises);
			const flat = results.flat();
			const seen = new Set<string>();
			allQuizzes = flat.filter((q) => {
				if (seen.has(q.id)) return false;
				seen.add(q.id);
				return true;
			});

			// Extract unique subjects for dropdown filter
			const subjectsSet = new Set<string>();
			allQuizzes.forEach((q: any) => {
				const sName = q.teacher?.subjectTeachers?.[0]?.subject?.name;
				if (sName) subjectsSet.add(sName);
			});

			subjectOptions = [
				{ value: 'all', label: 'Semua Mapel' },
				...Array.from(subjectsSet).map((s) => ({ value: s, label: s }))
			];
		} catch (err: any) {
			errorMsg = err.message || 'Gagal memuat data kuis';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadQuizzes();
	});

	async function handleDelete() {
		if (!deletingId) return;
		isDeleting = true;
		try {
			await lmsStore.deleteQuiz(deletingId);
			allQuizzes = allQuizzes.filter((q) => q.id !== deletingId);
			deletingId = null;
		} catch (err: any) {
			alert(err.message || 'Gagal menghapus kuis');
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Daftar Kuis - Akademik-BN</title>
</svelte:head>

<div class="flex justify-between items-end mb-6 mt-4">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">
			Daftar Kuis
		</h2>
		<p class="font-body-md text-secondary">Kelola kuis, draft, dan publikasi untuk kelas Anda.</p>
	</div>
	<a href="/teacher/quizzes/new">
		<Button variant="primary">
			<span class="material-symbols-outlined text-sm">add</span>
			Tambah Kuis
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
			<p class="font-bold text-secondary text-lg">Memuat kuis...</p>
		</div>
	{:else if errorMsg}
		<div class="bg-surface-container p-6 neo-border text-center">
			<span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
			<p class="font-bold text-error">{errorMsg}</p>
		</div>
	{:else if filteredQuizzes.length === 0}
		<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4">inbox</span>
			<p class="font-bold text-secondary text-lg">Tidak ada kuis ditemukan.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-6">
			{#each paginatedQuizzes as quiz}
				<QuizCard quiz={quiz} href={`/teacher/quizzes/${quiz.id}`} showStatus={true} role="teacher" />
			{/each}
		</div>

		<!-- Pagination Component -->
		<Pagination
			{currentPage}
			{totalPages}
			totalItems={filteredQuizzes.length}
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
				Hapus Kuis?
			</h4>
			<p class="font-body-md">Apakah Anda yakin ingin menghapus kuis ini? Tindakan ini tidak dapat dibatalkan.</p>
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
