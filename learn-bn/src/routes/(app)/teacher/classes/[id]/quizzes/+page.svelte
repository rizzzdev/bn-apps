<script lang="ts">
	import { page } from '$app/stores';
	import { lmsStore, type Quiz } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';
	import QuizCard from '$lib/components/QuizCard.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let classId = $derived($page.params.id as string);

	let quizzes = $state<Quiz[]>([]);
	let loading = $state(true);
	let errorMsg = $state('');

	// Filter states
	let selectedSubject = $state('all');
	let selectedStatus = $state('all');
	let subjectOptions = $state<SelectOption[]>([]);

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 5;

	async function loadQuizzes() {
		loading = true;
		errorMsg = '';
		try {
			const res = await lmsStore.getQuizzesByClass(classId);
			quizzes = res;

			const subjectMap = new Map<string, string>();
			for (const q of res) {
				if (q.teacher?.subjectTeachers) {
					for (const st of q.teacher.subjectTeachers) {
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
			errorMsg = err.message || 'Gagal memuat kuis';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadQuizzes();
	});

	let statusOptions: SelectOption[] = [
		{ label: 'Semua Status', value: 'all' },
		{ label: 'Published', value: 'Published' },
		{ label: 'Draft', value: 'Draft' }
	];

	let filteredQuizzes = $derived(
		quizzes.filter((q) => {
			if (selectedStatus !== 'all' && q.status !== selectedStatus) return false;
			if (selectedSubject !== 'all') {
				const hasSub = q.teacher?.subjectTeachers?.some((st) => st.subject?.id === selectedSubject);
				if (!hasSub) return false;
			}
			return true;
		})
	);

	let totalPages = $derived(Math.ceil(filteredQuizzes.length / itemsPerPage) || 1);
	let paginatedQuizzes = $derived(
		filteredQuizzes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);
</script>

<svelte:head>
	<title>Kuis Kelas - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div class="flex justify-between items-center">
		<h3 class="font-headline-md text-xl font-bold flex items-center gap-2">
			<span class="material-symbols-outlined text-2xl">quiz</span>
			Kuis Kelas
		</h3>
		<a href={`/teacher/quizzes/new?classId=${classId}`}>
			<Button variant="primary">
				<span class="material-symbols-outlined text-sm">add</span>
				Buat Kuis
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
			<p class="font-bold text-secondary text-lg">Belum ada kuis untuk kelas ini.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-6">
			{#each paginatedQuizzes as quiz}
				<QuizCard quiz={quiz} href={`/teacher/quizzes/${quiz.id}`} showStatus={true} role="teacher" />
			{/each}
		</div>

		<Pagination
			{currentPage}
			{totalPages}
			totalItems={filteredQuizzes.length}
			{itemsPerPage}
			onPageChange={(p) => (currentPage = p)}
		/>
	{/if}
</div>
