<script lang="ts">
	import { Button } from '$lib/components/atoms';
	import { PageHeader, Pagination, Modal, SearchableSelect } from '$lib/components/molecules';

	import { SubjectTable } from '$lib/features/subject';
	import { subjectApi, teacherApi } from '$lib/services';
	import type { Subject, ShadowSubject, SubjectTeacher, ShadowTeacher, ShadowSubject as ShadowSubj } from '$lib/types';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.svelte';

	let subjects = $state<Subject[]>([]);
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalItems = $state(0);
	let itemsPerPage = 10;
	let isLoading = $state(true);
	let error = $state('');

	let allTeachers = $state<ShadowTeacher[]>([]);
	let allSubjects = $state<ShadowSubj[]>([]);

	// Add Teacher Mapping Modal
	let isAddTeacherOpen = $state(false);
	let selectedSubjectId = $state('');
	let addTeacherIds = $state<string[]>([]);

	async function loadSubjects() {
		isLoading = true;
		error = '';
		try {
			const [res, stRes] = await Promise.all([
				subjectApi.list(currentPage, itemsPerPage),
				teacherApi.subjectTeachers.list(1, 1000)
			]);

			const subjectTeachers = stRes.data || [];

			if (res.data) {
				subjects = res.data.map((s: ShadowSubject) => {
					const totalTeachers = subjectTeachers.filter(
						(st: SubjectTeacher) =>
							st.subjectId === s.id && st.status === 'Aktif'
					).length;

					return {
						id: s.id,
						name: s.name,
						code: s.code,
						totalTeachers,
						teacherId: '-',
						teacherName: '-',
						field: '-'
					};
				});
			}
			if (res.pagination) {
				totalPages = res.pagination.totalPage;
				totalItems = res.pagination.totalData;
			}
		} catch (e) {
			error = String(e);
			toast.error('Gagal memuat data mata pelajaran');
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		if (currentPage) loadSubjects();
	});

	function openView(subject: Subject) {
		goto(`/subject/${subject.id}`);
	}

	function openHistory(subject: Subject) {
		goto(`/subject/${subject.id}/teacher-history`);
	}

	async function openAddTeacher(targetSubject?: Subject) {
		try {
			const [tchRes, subjRes] = await Promise.all([
				teacherApi.list(1, 1000),
				subjectApi.list(1, 1000)
			]);
			if (tchRes.data) allTeachers = tchRes.data;
			if (subjRes.data) allSubjects = subjRes.data;
			if (targetSubject) {
				selectedSubjectId = targetSubject.id;
			} else if (subjects.length > 0) {
				selectedSubjectId = subjects[0].id;
			}
			addTeacherIds = [];
			isAddTeacherOpen = true;
		} catch {
			toast.error('Gagal memuat data referensi');
		}
	}

	async function handleAddTeacher() {
		if (!selectedSubjectId || addTeacherIds.length === 0) {
			toast.error('Pilih mata pelajaran dan guru terlebih dahulu');
			return;
		}

		try {
			const payloads = addTeacherIds.map((teacherId) => ({
				teacherId,
				subjectId: selectedSubjectId,
				status: 'Aktif' as const
			}));

			for (const payload of payloads) {
				await teacherApi.subjectTeachers.create(payload);
			}
			toast.success('Pemetaan guru mata pelajaran berhasil ditambahkan');
			isAddTeacherOpen = false;
			addTeacherIds = [];
			await loadSubjects();
		} catch (e) {
			toast.error('Gagal menambahkan pemetaan guru mata pelajaran');
		}
	}
</script>

<div class="flex flex-col gap-8">
	<PageHeader
		title="Pemetaan Guru Mata Pelajaran"
		description="MANAJEMEN PEMETAAN GURU DAFTAR MATA PELAJARAN"
	/>

	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono">
			Memuat data...
		</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 font-data-mono text-data-mono">
			{error}
		</div>
	{:else}
		<SubjectTable
			{subjects}
			onView={openView}
			onAddTeacher={openAddTeacher}
			onHistoryTeacher={openHistory}
		/>

		<Pagination bind:currentPage {totalPages} {totalItems} {itemsPerPage} />
	{/if}
</div>

<Modal bind:isOpen={isAddTeacherOpen} title="Tambah Pemetaan Guru Mata Pelajaran">
	<div class="flex flex-col gap-4">
		<SearchableSelect
			id="subject-select"
			label="Mata Pelajaran"
			bind:value={selectedSubjectId}
			options={allSubjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
			placeholder="Pilih Mata Pelajaran"
		/>
		<SearchableSelect
			id="teacher-select"
			label="Guru"
			bind:value={addTeacherIds}
			options={allTeachers
				.filter((t) => t.status === 'Aktif')
				.map((t) => ({ value: t.id, label: t.fullname }))}
			placeholder="Pilih Guru"
			multiple={true}
		/>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isAddTeacherOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleAddTeacher}>Simpan</Button>
	{/snippet}
</Modal>
