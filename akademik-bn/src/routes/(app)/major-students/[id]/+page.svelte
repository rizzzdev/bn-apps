<script lang="ts">
	import { Button, Icon } from '$lib/components/atoms';
	import {
		DetailHeader,
		LeaderCard,
		StudentCard,
		AssignTeacherModal,
		AssignStudentModal,
		SearchBar,
		Modal,
		SearchableSelect,
		TooltipIconButton
	} from '$lib/components/molecules';
	import { majorApi, studentApi, academicYearApi, majorHeadApi, teacherApi } from '$lib/services';
	import type {
		Major,
		MajorHead,
		ShadowMajor,
		ShadowStudent,
		ShadowAcademicYear,
		ShadowTeacher
	} from '$lib/types';
	import { toast } from '$lib/stores/toast.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let id = $derived($page.params.id ?? '');
	let major = $state<Major | null>(null);
	let students = $state<ShadowStudent[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	let isSetHeadOpen = $state(false);
	let selectedTeacherId = $state('');

	function openSetHead() {
		selectedTeacherId = activeMajorHead?.teacherId ?? '';
		isSetHeadOpen = true;
	}

	async function fetchMajorHead() {
		try {
			const headRes = await majorHeadApi.list(1, 100);
			if (headRes.data) {
				const heads = headRes.data as MajorHead[];
				activeMajorHead =
					heads.find(
						(h) => h.majorId === id && h.academicYearId === activeYearId && h.status === 'Aktif'
					) ?? null;
			}
		} catch {
			activeMajorHead = null;
		}
	}

	async function handleSetHead() {
		if (!selectedTeacherId || !id) {
			toast.error('Pilih kepala jurusan terlebih dahulu');
			return;
		}

		try {
			const res = await majorHeadApi.assignHead({
				majorId: id,
				teacherId: selectedTeacherId,
				academicYearId: activeYearId
			});

			toast.success(res.message || 'Kepala jurusan berhasil diperbarui');
			isSetHeadOpen = false;
			await fetchMajorHead();
		} catch {
			toast.error('Gagal memperbarui kepala jurusan');
		}
	}

	let activeYearId = $state('');
	let allStudents = $state<ShadowStudent[]>([]);
	let allYears = $state<ShadowAcademicYear[]>([]);
	let allTeachers = $state<ShadowTeacher[]>([]);
	let activeMajorHead = $state<MajorHead | null>(null);
	let activeHeadTeacherData = $derived(
		allTeachers.find((t) => t.id === activeMajorHead?.teacherId) ?? null
	);

	let searchQuery = $state('');

	let isAddStudentOpen = $state(false);
	let addStudentIds = $state<string[]>([]);
	let availableAddStudents = $state<ShadowStudent[]>([]);

	let isBulkActionOpen = $state(false);
	let bulkActionType = $state<'transfer' | 'graduate' | 'delete'>('transfer');
	let bulkSelectedStudentIds = $state<string[]>([]);
	let activeMajorStudentMap = $state<Record<string, string>>({});

	let filteredStudents = $derived(
		students.filter(
			(s) =>
				s.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(s.nis && s.nis.includes(searchQuery)) ||
				(s.nisn && s.nisn.includes(searchQuery))
		)
	);

	function selectAllStudents() {
		if (bulkSelectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
			bulkSelectedStudentIds = [];
		} else {
			bulkSelectedStudentIds = filteredStudents.map((s) => s.id);
		}
	}

	function toggleStudentSelection(student: ShadowStudent) {
		if (bulkSelectedStudentIds.includes(student.id)) {
			bulkSelectedStudentIds = bulkSelectedStudentIds.filter((s) => s !== student.id);
		} else {
			bulkSelectedStudentIds = [...bulkSelectedStudentIds, student.id];
		}
	}

	async function openAddStudent() {
		addStudentIds = [];
		availableAddStudents = [];
		if (activeYearId) {
			const res = await studentApi.list(1, 1000, {
				status: 'Aktif',
				excludeWithMajor: 'true',
				academicYearId: activeYearId
			});
			if (res.data) availableAddStudents = res.data as ShadowStudent[];
		}
		isAddStudentOpen = true;
	}

	function openBulkAction() {
		if (bulkSelectedStudentIds.length === 0) {
			toast.error('Silakan pilih murid dengan mencentang kotaknya terlebih dahulu');
			return;
		}
		bulkActionType = 'transfer';
		isBulkActionOpen = true;
	}

	async function handleAddStudent() {
		if (addStudentIds.length === 0) {
			toast.error('Pilih minimal 1 murid');
			return;
		}
		try {
			const payloads = addStudentIds.map((studentId) => ({
				majorId: id,
				studentId,
				academicYearId: activeYearId,
				status: 'Aktif' as const
			}));
			await majorApi.majorStudents.bulkCreate(payloads);
			toast.success(`${payloads.length} murid berhasil ditambahkan ke jurusan`);
			isAddStudentOpen = false;
			await fetchStudents();
		} catch {
			toast.error('Gagal menambahkan murid');
		}
	}

	async function handleBulkAction() {
		if (bulkSelectedStudentIds.length === 0) {
			toast.error('Pilih minimal 1 murid');
			return;
		}
		try {
			let res;
			if (bulkActionType === 'transfer') {
				res = await majorApi.majorStudents.transfer({ studentIds: bulkSelectedStudentIds });
			} else if (bulkActionType === 'graduate') {
				res = await majorApi.majorStudents.graduate({ studentIds: bulkSelectedStudentIds });
			} else if (bulkActionType === 'delete') {
				const msIds = bulkSelectedStudentIds.map((id) => activeMajorStudentMap[id]).filter(Boolean);
				res = await majorApi.majorStudents.bulkDelete(msIds);
			}

			if (res && !res.error) {
				toast.success('Aksi akademik berhasil diproses');
				isBulkActionOpen = false;
				bulkSelectedStudentIds = [];
				await fetchStudents();
			} else {
				toast.error(res?.message || 'Gagal memproses aksi akademik');
			}
		} catch {
			toast.error('Gagal memproses aksi akademik');
		}
	}

	async function fetchStudents() {
		if (!id || !activeYearId) return;
		const msRes = await majorApi.majorStudents.list(1, 1000);
		if (msRes.data) {
			const activeMajorStudents = msRes.data.filter(
				(ms) => ms.majorId === id && ms.academicYearId === activeYearId && ms.status === 'Aktif'
			);
			activeMajorStudentMap = activeMajorStudents.reduce(
				(acc, ms) => {
					acc[ms.studentId] = ms.id;
					return acc;
				},
				{} as Record<string, string>
			);

			students = activeMajorStudents
				.map((ms) => allStudents.find((s) => s.id === ms.studentId))
				.filter(Boolean) as ShadowStudent[];
		}

		if (major) {
			major.totalStudents = students.length;
		}
	}

	onMount(async () => {
		isLoading = true;
		if (!id) {
			error = 'ID tidak valid';
			isLoading = false;
			return;
		}
		try {
			const yearsRes = await academicYearApi.list(1, 100);
			if (yearsRes.data) {
				allYears = yearsRes.data as ShadowAcademicYear[];
				const activeYear = allYears.find((y) => y.status === 'Aktif');
				if (activeYear) activeYearId = activeYear.id;
			}

			const [majorRes, studentListRes, teacherRes] = await Promise.all([
				majorApi.getById(id),
				studentApi.list(1, 1000),
				teacherApi.list(1, 1000)
			]);

			if (majorRes.data) {
				const m = majorRes.data as ShadowMajor;
				major = {
					id: m.id,
					name: m.name,
					code: m.code,
					totalStudents: 0,
					headOfDepartment: '-',
					headOfDepartmentNip: '-',
					status: 'Aktif'
				};
			}

			if (studentListRes.data) {
				allStudents = studentListRes.data as ShadowStudent[];
			}

			if (teacherRes.data) {
				allTeachers = teacherRes.data as ShadowTeacher[];
			}

			const headRes = await majorHeadApi.list(1, 100);
			if (headRes.data) {
				const heads = headRes.data as MajorHead[];
				activeMajorHead =
					heads.find(
						(h) => h.majorId === id && h.academicYearId === activeYearId && h.status === 'Aktif'
					) ?? null;
			}

			await fetchStudents();
		} catch {
			error = 'Gagal memuat data jurusan';
		} finally {
			isLoading = false;
		}
	});
</script>

<svelte:head>
	<title>{major ? `${major.name} - Akademik-BN` : 'Detail Jurusan - Akademik-BN'}</title>
</svelte:head>

<div class="flex flex-col gap-6">
	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-xs">
			Memuat data...
		</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 text-center">
			<h2 class="font-headline-md text-lg text-error">Terjadi Kesalahan</h2>
			<p class="font-data-mono text-xs text-on-surface-variant mt-2">{error}</p>
			<a href="/major-students" class="font-data-mono text-xs text-primary underline mt-4 inline-block">
				Kembali ke daftar jurusan
			</a>
		</div>
	{:else if major}
		<DetailHeader
			title="Detail Jurusan"
			name={major.name}
			code={major.code}
			backHref="/major-students"
		/>

		<div class="flex flex-col gap-8">
			<!-- Leader Section -->
			<div class="flex flex-col gap-3">
				<div class="flex items-center justify-between border-b-2 pb-2">
					<h3 class="font-headline-md text-lg font-bold">Kepala Jurusan</h3>
					<div class="flex items-center gap-2">
						<TooltipIconButton
							icon="history"
							tooltip="Riwayat Kepala Jurusan"
							onclick={() => goto(`/major-students/${id}/head-history`)}
						/>
						<TooltipIconButton
							icon="admin_panel_settings"
							tooltip="Set Kepala Jurusan"
							onclick={openSetHead}
						/>
					</div>
				</div>
				<div class="flex justify-center md:justify-start">
					<LeaderCard
						leaderData={activeHeadTeacherData}
						roleTitle="Kepala Jurusan"
						emptyTitle="Belum ada Kepala Jurusan"
						onAssign={openSetHead}
					/>
				</div>
			</div>

			<!-- Student Section -->
			<div class="flex flex-col gap-3">
				<div class="flex items-center gap-3 border-b-2 pb-2">
					<h3 class="font-headline-md text-lg font-bold">Daftar Murid</h3>
					<span class="border-2 border-on-background bg-primary-fixed text-on-background px-2 py-0.5 font-bold font-data-mono neo-shadow-xs text-xs">
						{students.length} Murid
					</span>
				</div>

				<div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full mb-2">
					<div class="w-full sm:w-64">
						<SearchBar bind:value={searchQuery} placeholder="Cari NIS/Nama..." class="w-full" />
					</div>
					<div class="flex items-center gap-2">
						<TooltipIconButton
							icon="school"
							tooltip="Riwayat Alumni & Murid"
							onclick={() => goto(`/major-students/${id}/alumni`)}
						/>
						<TooltipIconButton
							icon={bulkSelectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? 'deselect' : 'checklist'}
							tooltip={bulkSelectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? 'Batal Pilih Semua' : 'Pilih Semua'}
							onclick={selectAllStudents}
						/>
						{#if bulkSelectedStudentIds.length > 0}
							<TooltipIconButton
								icon="groups"
								tooltip={`Aksi Massal (${bulkSelectedStudentIds.length} murid terpilih)`}
								onclick={openBulkAction}
								badgeCount={bulkSelectedStudentIds.length}
							/>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
					{#each filteredStudents as student (student.id)}
						<StudentCard
							{student}
							isSelected={bulkSelectedStudentIds.includes(student.id)}
							onToggleSelect={toggleStudentSelection}
						/>
					{/each}
					<button
						onclick={openAddStudent}
						class="neo-border border-dashed border-on-background opacity-70 flex flex-col items-center justify-center p-4 gap-2 hover:opacity-100 transition-opacity cursor-pointer min-h-[100px]"
					>
						<Icon name="add_circle" size="28px" class="text-on-surface-variant" />
						<span class="font-label-caps text-xs uppercase text-on-surface-variant font-bold">
							Tambah Murid
						</span>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<AssignStudentModal
	bind:isOpen={isAddStudentOpen}
	title="Tambah Murid ke Jurusan"
	showTargetSelect={false}
	bind:selectedStudentIds={addStudentIds}
	students={availableAddStudents}
	onSave={handleAddStudent}
/>

<AssignTeacherModal
	bind:isOpen={isSetHeadOpen}
	title={`Set Kepala Jurusan - ${major?.name ?? ''}`}
	label="Guru Kepala Jurusan"
	bind:selectedTeacherId
	teachers={allTeachers}
	onSave={handleSetHead}
/>

<Modal bind:isOpen={isBulkActionOpen} title="Aksi Akademik Massal">
	<div class="flex flex-col gap-4">
		<div>
			<span class="block font-label-caps text-xs font-bold mb-2 text-on-surface">
				Murid Terpilih ({bulkSelectedStudentIds.length}):
			</span>
			<div class="neo-border bg-surface-container p-3 max-h-40 overflow-y-auto">
				<ul class="list-disc list-inside font-data-mono text-xs">
					{#each bulkSelectedStudentIds as studentId}
						<li>{students.find((s) => s.id === studentId)?.fullname || studentId}</li>
					{/each}
				</ul>
			</div>
		</div>

		<SearchableSelect
			id="action-type"
			label="Jenis Aksi"
			bind:value={bulkActionType}
			options={[
				{ value: 'transfer', label: 'Pindah Jurusan' },
				{ value: 'graduate', label: 'Lulus' },
				{ value: 'delete', label: 'Keluarkan dari Jurusan (Hapus)' }
			]}
			searchThreshold={10}
		/>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isBulkActionOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleBulkAction}>Proses</Button>
	{/snippet}
</Modal>
