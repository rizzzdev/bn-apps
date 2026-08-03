<script lang="ts">
	import {
		PageHeader,
		Pagination,
		SearchBar,
		AssignStudentModal,
		AssignTeacherModal
	} from '$lib/components/molecules';
	import { MajorTable } from '$lib/features/major';
	import { majorApi, academicYearApi, studentApi, teacherApi, majorHeadApi } from '$lib/services';
	import type {
		Major,
		ShadowMajor,
		MajorStudent,
		ShadowStudent,
		ShadowTeacher,
		CreateMajorStudentRequest
	} from '$lib/types';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';

	let majors = $state<Major[]>([]);
	let currentPage = $state(1);
	let searchTerm = $state('');
	let itemsPerPage = 10;
	let isLoading = $state(true);
	let error = $state('');

	let filteredMajors = $derived.by(() => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return majors;
		return majors.filter(
			(m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
		);
	});
	let totalItems = $derived(filteredMajors.length);
	let totalPages = $derived(Math.max(1, Math.ceil(totalItems / itemsPerPage)));
	let displayedMajors = $derived(
		filteredMajors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
	);

	let activeYearId = $state('');
	let isAddStudentOpen = $state(false);
	let selectedMajorId = $state('');
	let addStudentIds = $state<string[]>([]);
	let allStudents = $state<ShadowStudent[]>([]);
	let allMajors = $state<ShadowMajor[]>([]);

	let isSetHeadOpen = $state(false);
	let targetHeadMajor = $state<Major | null>(null);
	let selectedTeacherId = $state('');
	let allTeachers = $state<ShadowTeacher[]>([]);

	async function loadMajors() {
		isLoading = true;
		error = '';
		try {
			if (!activeYearId) {
				const yearsRes = await academicYearApi.list(1, 100);
				const activeYear = yearsRes.data?.find((y) => y.status === 'Aktif');
				if (activeYear) activeYearId = activeYear.id;
			}

			const [res, studentsRes] = await Promise.all([
				majorApi.list(1, 1000),
				majorApi.majorStudents.list(1, 1000)
			]);

			const majorStudents = studentsRes.data || [];

			if (res.data) {
				majors = res.data.map((m: ShadowMajor) => {
					const totalStudents = majorStudents.filter(
						(ms: MajorStudent) =>
							ms.majorId === m.id && ms.status === 'Aktif' && ms.academicYearId === activeYearId
					).length;

					return {
						id: m.id,
						name: m.name,
						code: m.code,
						totalStudents,
						headOfDepartment: '-',
						headOfDepartmentNip: '-',
						status: 'Aktif'
					};
				});
			}
		} catch (e) {
			error = String(e);
			toast.error('Gagal memuat data jurusan');
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		const _ = searchTerm;
		currentPage = 1;
	});

	onMount(() => {
		loadMajors();
	});

	function openView(major: Major) {
		goto(`/major-students/${major.id}`);
	}

	async function openAddStudent(targetMajor?: Major) {
		try {
			const studentParams: Record<string, string> = { status: 'Aktif' };
			if (activeYearId) {
				studentParams.excludeWithMajor = 'true';
				studentParams.academicYearId = activeYearId;
			}
			const [studRes, majRes] = await Promise.all([
				studentApi.list(1, 1000, studentParams),
				majorApi.list(1, 1000)
			]);
			if (studRes.data) allStudents = studRes.data;
			if (majRes.data) allMajors = majRes.data;
			if (targetMajor) {
				selectedMajorId = targetMajor.id;
			} else if (majors.length > 0) {
				selectedMajorId = majors[0].id;
			}
			addStudentIds = [];
			isAddStudentOpen = true;
		} catch {
			toast.error('Gagal memuat data referensi');
		}
	}

	async function handleAddStudent() {
		if (!selectedMajorId || addStudentIds.length === 0 || !activeYearId) {
			toast.error('Pilih jurusan dan murid terlebih dahulu');
			return;
		}

		try {
			const payloads: CreateMajorStudentRequest[] = addStudentIds.map((studentId) => ({
				studentId,
				majorId: selectedMajorId,
				academicYearId: activeYearId,
				status: 'Aktif'
			}));

			await majorApi.majorStudents.bulkCreate(payloads);
			toast.success('Pemetaan murid jurusan berhasil ditambahkan');
			isAddStudentOpen = false;
			addStudentIds = [];
			await loadMajors();
		} catch {
			toast.error('Gagal menambahkan pemetaan murid jurusan');
		}
	}

	async function openSetHead(major: Major) {
		try {
			targetHeadMajor = major;
			const [tchRes, mhRes] = await Promise.all([
				teacherApi.list(1, 1000),
				majorHeadApi.listByMajor(major.id)
			]);
			if (tchRes.data) allTeachers = tchRes.data;
			const activeHead = mhRes.data?.find(
				(h) => h.status === 'Aktif' && h.academicYearId === activeYearId
			);
			selectedTeacherId = activeHead?.teacherId ?? '';
			isSetHeadOpen = true;
		} catch {
			toast.error('Gagal memuat data guru');
		}
	}

	async function handleSetHead() {
		if (!targetHeadMajor || !selectedTeacherId) {
			toast.error('Pilih kepala jurusan terlebih dahulu');
			return;
		}

		try {
			const res = await majorHeadApi.assignHead({
				majorId: targetHeadMajor.id,
				teacherId: selectedTeacherId,
				academicYearId: activeYearId
			});

			toast.success(res.message || 'Kepala jurusan berhasil diperbarui');
			isSetHeadOpen = false;
			selectedTeacherId = '';
			targetHeadMajor = null;
			await loadMajors();
		} catch {
			toast.error('Gagal memperbarui kepala jurusan');
		}
	}
</script>

<svelte:head>
	<title>Pemetaan Murid Jurusan - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		title="Pemetaan Murid Jurusan"
		description="MANAJEMEN PEMETAAN MURID DAFTAR JURUSAN AKADEMIK"
	/>

	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-xs">Memuat data...</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 text-center font-data-mono text-xs">
			{error}
		</div>
	{:else}
		<SearchBar bind:value={searchTerm} placeholder="Cari jurusan (nama / kode)..." />

		<MajorTable
			majors={displayedMajors}
			onView={openView}
			onAddStudent={openAddStudent}
			onSetHead={openSetHead}
			onHistoryHead={(major) => goto(`/major-students/${major.id}/head-history`)}
			onHistoryStudent={(major) => goto(`/major-students/${major.id}/alumni`)}
		/>

		<Pagination bind:currentPage {totalPages} {totalItems} {itemsPerPage} />
	{/if}
</div>

<AssignStudentModal
	bind:isOpen={isAddStudentOpen}
	title="Tambah Pemetaan Murid Jurusan"
	targetLabel="Jurusan"
	bind:selectedTargetId={selectedMajorId}
	targetOptions={allMajors.map((m) => ({ value: m.id, label: `${m.name} (${m.code})` }))}
	bind:selectedStudentIds={addStudentIds}
	students={allStudents}
	onSave={handleAddStudent}
/>

<AssignTeacherModal
	bind:isOpen={isSetHeadOpen}
	title={`Set Kepala Jurusan - ${targetHeadMajor?.name ?? ''}`}
	label="Guru Kepala Jurusan"
	bind:selectedTeacherId
	teachers={allTeachers}
	onSave={handleSetHead}
/>
