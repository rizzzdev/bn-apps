<script lang="ts">
	import { PageHeader, Pagination, AssignStudentModal, AssignTeacherModal } from '$lib/components/molecules';
	import { ClassTable } from '$lib/features/class';
	import { classApi, majorApi, academicYearApi, studentApi, teacherApi } from '$lib/services';
	import type {
		Class,
		ShadowClass,
		ClassStudent,
		MajorStudent,
		ShadowMajor,
		ShadowStudent,
		ShadowTeacher
	} from '$lib/types';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.svelte';

	let classes = $state<Class[]>([]);
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalItems = $state(0);
	let itemsPerPage = 10;
	let isLoading = $state(true);
	let error = $state('');

	let activeYearId = $state('');
	let majorOptions = $state<{ value: string; label: string; code: string }[]>([]);

	let isAddStudentOpen = $state(false);
	let selectedClassId = $state('');
	let addStudentIds = $state<string[]>([]);
	let allStudents = $state<ShadowStudent[]>([]);
	let allMajors = $state<ShadowMajor[]>([]);
	let majorStudentMap = $state<Record<string, string>>({});

	let selectedClassMajorId = $state('');

	$effect(() => {
		const cls = classes.find((c) => c.id === selectedClassId);
		selectedClassMajorId = cls?.majorId ?? '';
		addStudentIds = [];
	});

	let isSetHomeroomOpen = $state(false);
	let targetHomeroomClass = $state<Class | null>(null);
	let selectedTeacherId = $state('');
	let allTeachers = $state<ShadowTeacher[]>([]);

	async function openSetHomeroom(cls: Class) {
		try {
			targetHomeroomClass = cls;
			const [tchRes, htRes] = await Promise.all([
				teacherApi.list(1, 1000),
				teacherApi.homeroom.listByClass(cls.id)
			]);
			if (tchRes.data) allTeachers = tchRes.data;
			const activeHomeroom = htRes.data?.find(
				(h) => h.status === 'Aktif' && h.academicYearId === activeYearId
			);
			selectedTeacherId = activeHomeroom?.teacherId ?? '';
			isSetHomeroomOpen = true;
		} catch {
			toast.error('Gagal memuat data guru');
		}
	}

	async function handleSetHomeroom() {
		if (!targetHomeroomClass || !selectedTeacherId) {
			toast.error('Pilih wali kelas terlebih dahulu');
			return;
		}
		try {
			await teacherApi.homeroom.create({
				classId: targetHomeroomClass.id,
				teacherId: selectedTeacherId,
				academicYearId: activeYearId,
				status: 'Aktif'
			});
			toast.success('Wali kelas berhasil diperbarui');
			isSetHomeroomOpen = false;
			selectedTeacherId = '';
			targetHomeroomClass = null;
			await loadClasses();
		} catch {
			toast.error('Gagal memperbarui wali kelas');
		}
	}

	async function loadClasses() {
		isLoading = true;
		error = '';
		try {
			if (!activeYearId) {
				const yearsRes = await academicYearApi.list(1, 100);
				const activeYear = yearsRes.data?.find((y) => y.status === 'Aktif');
				if (activeYear) activeYearId = activeYear.id;
			}

			const [res, studentsRes, majorsRes] = await Promise.all([
				classApi.list(currentPage, itemsPerPage),
				classApi.classStudents.list(1, 1000),
				majorApi.list(1, 100)
			]);

			const classStudents = studentsRes.data || [];
			const majors = majorsRes.data || [];
			majorOptions = majors.map((m: ShadowMajor) => ({
				value: m.id,
				label: m.name,
				code: m.code
			}));

			if (res.data) {
				classes = res.data.map((c: ShadowClass) => {
					const major = majors.find((m: ShadowMajor) => m.id === c.majorId);
					const totalStudents = classStudents.filter(
						(cs: ClassStudent) =>
							cs.classId === c.id && cs.status === 'Aktif' && cs.academicYearId === activeYearId
					).length;
					return {
						id: c.id,
						majorId: c.majorId,
						majorCode: major ? major.code : '-',
						name: c.name,
						totalStudents,
						homeroomTeacher: '-',
						homeroomTeacherNip: '-',
						academicYear: '-',
						semester: 1
					};
				});
			}
			if (res.pagination) {
				totalPages = res.pagination.totalPage;
				totalItems = res.pagination.totalData;
			}
		} catch (e) {
			error = String(e);
			toast.error('Gagal memuat data kelas');
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		if (currentPage) loadClasses();
	});

	function openView(cls: Class) {
		goto(`/class-students/${cls.id}`);
	}

	async function openAddStudent(targetClass?: Class) {
		try {
			const studentParams: Record<string, string> = { status: 'Aktif' };
			if (activeYearId) {
				studentParams.excludeWithClass = 'true';
				studentParams.academicYearId = activeYearId;
			}
			const [studRes, majRes, msRes] = await Promise.all([
				studentApi.list(1, 1000, studentParams),
				majorApi.list(1, 1000),
				majorApi.majorStudents.list(1, 10000)
			]);
			if (studRes.data) allStudents = studRes.data;
			if (majRes.data) allMajors = majRes.data;

			if (msRes.data) {
				const activeMS = (msRes.data as MajorStudent[]).filter(
					(ms) => ms.status === 'Aktif' && ms.deletedAt === null
				);
				majorStudentMap = activeMS.reduce(
					(acc, ms) => {
						acc[ms.studentId] = ms.majorId;
						return acc;
					},
					{} as Record<string, string>
				);
			}

			if (targetClass) {
				selectedClassId = targetClass.id;
			} else if (classes.length > 0) {
				selectedClassId = classes[0].id;
			}
			addStudentIds = [];
			isAddStudentOpen = true;
		} catch {
			toast.error('Gagal memuat data referensi');
		}
	}

	async function handleAddStudent() {
		if (!selectedClassId || addStudentIds.length === 0 || !activeYearId) {
			toast.error('Pilih kelas dan murid terlebih dahulu');
			return;
		}
		try {
			const payloads = addStudentIds.map((studentId) => ({
				classId: selectedClassId,
				studentId,
				academicYearId: activeYearId,
				status: 'Aktif' as const
			}));
			await classApi.classStudents.bulkCreate(payloads);
			toast.success('Pemetaan murid kelas berhasil ditambahkan');
			isAddStudentOpen = false;
			addStudentIds = [];
			await loadClasses();
		} catch {
			toast.error('Gagal menambahkan pemetaan murid kelas');
		}
	}
</script>

<svelte:head>
	<title>Pemetaan Murid Kelas - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		title="Pemetaan Murid Kelas"
		description="MANAJEMEN PEMETAAN MURID DAFTAR KELAS AKADEMIK"
	/>

	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-xs">
			Memuat data...
		</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 font-data-mono text-xs">
			{error}
		</div>
	{:else}
		<ClassTable
			{classes}
			onView={openView}
			onAddStudent={openAddStudent}
			onSetHomeroom={openSetHomeroom}
			onHistoryHomeroom={(cls) => goto(`/class-students/${cls.id}/homeroom-history`)}
			onHistoryAlumni={(cls) => goto(`/class-students/${cls.id}/alumni`)}
		/>

		<Pagination bind:currentPage {totalPages} {totalItems} {itemsPerPage} />
	{/if}
</div>

<AssignStudentModal
	bind:isOpen={isAddStudentOpen}
	title="Tambah Pemetaan Murid Kelas"
	targetLabel="Kelas"
	bind:selectedTargetId={selectedClassId}
	targetOptions={classes.map((c) => ({ value: c.id, label: c.name }))}
	bind:selectedStudentIds={addStudentIds}
	students={allStudents.filter((s) => s.status === 'Aktif' && (selectedClassMajorId ? majorStudentMap[s.id] === selectedClassMajorId : true))}
	onSave={handleAddStudent}
/>

<AssignTeacherModal
	bind:isOpen={isSetHomeroomOpen}
	title={`Set Wali Kelas - ${targetHomeroomClass?.name ?? ''}`}
	label="Guru Wali Kelas"
	bind:selectedTeacherId
	teachers={allTeachers}
	onSave={handleSetHomeroom}
/>
