<script lang="ts">
	import { PageHeader, Pagination, SearchBar } from '$lib/components/molecules';
	import { TeacherTable } from '$lib/features/teacher';
	import { teacherApi } from '$lib/services';
	import type { Teacher, ShadowTeacher } from '$lib/types';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatTeacherName } from '$lib/utils/image';

	let teachers = $state<Teacher[]>([]);
	let searchQuery = $state('');
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalItems = $state(0);
	let itemsPerPage = 10;
	let isLoading = $state(true);
	let error = $state('');

	let filteredTeachers = $derived(
		teachers.filter((t) => {
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return (
				t.fullname.toLowerCase().includes(q) ||
				t.nip.includes(q) ||
				t.class.toLowerCase().includes(q)
			);
		})
	);

	async function loadTeachers() {
		isLoading = true;
		error = '';
		try {
			const res = await teacherApi.list(currentPage, itemsPerPage);
			if (res.data) {
				teachers = res.data.map((t: ShadowTeacher) => ({
					id: t.id,
					fullname: formatTeacherName(t),
					nip: t.nip ?? '-',
					subject: '-',
					field: '-',
					class: '-',
					academicYear: '-',
					photoUrl: t.pictureUrl ?? undefined
				}));
			}
			if (res.pagination) {
				totalPages = res.pagination.totalPage;
				totalItems = res.pagination.totalData;
			}
		} catch (e) {
			error = String(e);
			toast.error('Gagal memuat data guru');
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		if (currentPage) loadTeachers();
	});

	function handleView(teacher: Teacher) {
		toast.info(`Detail: ${teacher.fullname}`);
	}
</script>

<svelte:head>
	<title>Pemetaan Guru - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<PageHeader title="Pemetaan Guru" description="SHADOW DATA GURU">
		<SearchBar bind:value={searchQuery} placeholder="Cari Guru..." class="w-72" />
	</PageHeader>

	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono">
			Memuat data...
		</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 font-data-mono text-data-mono">
			{error}
		</div>
	{:else}
		<TeacherTable teachers={filteredTeachers} onView={handleView} />

		<Pagination bind:currentPage {totalPages} {totalItems} {itemsPerPage} />
	{/if}
</div>
