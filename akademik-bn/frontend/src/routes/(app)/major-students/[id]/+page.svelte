<script lang="ts">
	import { Button, Icon } from '$lib/components/atoms';
	import { SearchBar } from '$lib/components/molecules';
	import { MajorDetailHeader, HeadOfDepartmentCard, StudentCard } from '$lib/features/major';
	import { majorApi, studentApi, academicYearApi, majorHeadApi, teacherApi } from '$lib/services';
	import type {
		Major,
		MajorHead,
		Student,
		ShadowMajor,
		ShadowStudent,
		ShadowAcademicYear,
		ShadowTeacher
	} from '$lib/types';
	import { Modal, SearchableSelect, TooltipIconButton } from '$lib/components/molecules';
	import { toast } from '$lib/stores/toast.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { formatTeacherName } from '$lib/utils/image';

	let id = $derived($page.params.id ?? '');
	let major = $state<Major | null>(null);
	let students = $state<Student[]>([]);
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
	let activeMajorHead = $state<MajorHead | null>(null);
	let allTeachers = $state<ShadowTeacher[]>([]);

	let searchQuery = $state('');
	let visibleCount = $state(8);

	let isAddStudentOpen = $state(false);
	let addStudentIds = $state<string[]>([]);
	let addYearId = $state('');

	let isBulkActionOpen = $state(false);
	let bulkActionType = $state<'transfer' | 'graduate' | 'delete'>('transfer');
	let bulkSelectedStudentIds = $state<string[]>([]);
	let activeMajorStudentMap = $state<Record<string, string>>({});

	let filteredStudents = $derived(
		students.filter(
			(s) =>
				s.fullname.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery)
		)
	);

	function selectAllStudents() {
		if (bulkSelectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
			bulkSelectedStudentIds = [];
		} else {
			bulkSelectedStudentIds = filteredStudents.map((s) => s.id);
		}
	}

	function toggleStudentSelection(id: string) {
		if (bulkSelectedStudentIds.includes(id)) {
			bulkSelectedStudentIds = bulkSelectedStudentIds.filter((s) => s !== id);
		} else {
			bulkSelectedStudentIds = [...bulkSelectedStudentIds, id];
		}
	}

	function openAddStudent() {
		addStudentIds = [];
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
		} catch (e) {
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
		} catch (e) {
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

			const studentIds = new Set(activeMajorStudents.map((ms) => ms.studentId));

			students = activeMajorStudents
				.map((ms) => allStudents.find((s) => s.id === ms.studentId))
				.filter(Boolean)
				.map((s) => ({
					id: s!.id,
					fullname: s!.fullname,
					nis: s!.nis ?? '-',
					nisn: s!.nisn ?? '-',
					classId: '-',
					className: '-',
					majorId: id,
					majorName: major?.name ?? '-',
					academicYearId: activeYearId,
					status: 'Aktif',
					pictureUrl: s!.pictureUrl ?? null,
					photoUrl: s!.pictureUrl ?? undefined
				}))
				.reverse();
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
			const [majorRes, studentListRes, yearsRes, teacherRes] = await Promise.all([
				majorApi.getById(id),
				studentApi.list(1, 1000),
				academicYearApi.list(1, 100),
				teacherApi.list(1, 1000)
			]);

			if (yearsRes.data) {
				allYears = yearsRes.data as ShadowAcademicYear[];
				const activeYear = allYears.find((y) => y.status === 'Aktif');
				if (activeYear) activeYearId = activeYear.id;
			}

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
		} catch (e) {
			error = 'Gagal memuat data jurusan';
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="container mx-auto px-4 py-8">
	{#if isLoading}
		<div class="text-center py-xl">
			<p class="font-data-mono text-data-mono text-on-surface-variant">Memuat data...</p>
		</div>
	{:else if error}
		<div class="text-center py-xl">
			<h2 class="font-headline-md text-headline-md text-error">Terjadi Kesalahan</h2>
			<p class="font-data-mono text-data-mono text-on-surface-variant mt-2">{error}</p>
			<a href="/major-students" class="font-data-mono text-data-mono text-primary underline mt-4 inline-block"
				>Kembali ke daftar jurusan</a
			>
		</div>
	{:else if major}
		<MajorDetailHeader {major} />

		<div class="flex flex-col gap-12 mt-8">
			<div class="flex flex-col gap-4">
				<div class="neo-border-b pb-4">
					<h3 class="font-headline-md text-xl sm:text-headline-lg font-bold">Kepala Jurusan</h3>
				</div>
				<div class="flex justify-end items-center gap-2 w-full">						<TooltipIconButton icon="history" tooltip="Riwayat Kepala Jurusan" onclick={() => goto(`/major-students/${id}/head-history`)} />
					<TooltipIconButton icon="admin_panel_settings" tooltip="Set Kepala Jurusan" onclick={openSetHead} />
				</div>
				<div class="flex justify-center">
					<HeadOfDepartmentCard majorHead={activeMajorHead} teachers={allTeachers} />
				</div>
			</div>

			<div class="flex flex-col">
				<div class="flex items-center gap-4 mb-4 neo-border-b pb-4">
					<h3 class="font-headline-md text-xl sm:text-headline-lg font-bold">Daftar Murid</h3>
					<span
						class="border-2 border-on-background bg-primary-fixed text-on-background px-3 py-1 font-bold font-data-mono neo-shadow-xs text-xs sm:text-sm"
					>
						{students.length} Murid
					</span>
				</div>

				<div
					class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full mb-6"
				>
					<div class="w-full sm:w-72">
						<SearchBar bind:value={searchQuery} placeholder="Cari NIS/Nama..." class="w-full" />
					</div>
					<div class="flex gap-3">
						<TooltipIconButton icon="school" tooltip="Riwayat Alumni & Murid" onclick={() => goto(`/major-students/${id}/alumni`)} />
						<TooltipIconButton
							icon={bulkSelectedStudentIds.length === filteredStudents.length &&
							filteredStudents.length > 0
								? 'deselect'
								: 'checklist'}
							tooltip={bulkSelectedStudentIds.length === filteredStudents.length &&
							filteredStudents.length > 0
								? 'Batal Pilih Semua Murid'
								: 'Pilih Semua Murid'}
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

				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter auto-rows-max"
				>
					{#each filteredStudents as student, i (student.id)}
						<StudentCard
							{student}
							index={i}
							selected={bulkSelectedStudentIds.includes(student.id)}
							onToggle={() => toggleStudentSelection(student.id)}
						/>
					{/each}
					<button
						onclick={openAddStudent}
						class="neo-border border-dashed border-on-background opacity-70 flex flex-col items-center justify-center p-6 gap-2 hover:opacity-100 transition-opacity cursor-pointer h-full min-h-[200px]"
					>
						<Icon name="add_circle" size="40px" class="text-on-surface-variant" />
						<span class="font-label-caps text-label-caps uppercase text-on-surface-variant"
							>Tambah Murid</span
						>
					</button>
				</div>
			</div>
		</div>
{:else}
	<div class="text-center py-xl">
		<h2 class="font-headline-md text-headline-md text-error">Jurusan tidak ditemukan</h2>
		<a href="/major-students" class="font-data-mono text-data-mono text-primary underline mt-4 inline-block"
			>Kembali ke daftar jurusan</a
		>
	</div>
{/if}
</div>

<Modal bind:isOpen={isAddStudentOpen} title="Tambah Murid ke Jurusan">
	<div class="flex flex-col gap-4">
		<SearchableSelect
			id="student"
			label="Murid"
			bind:value={addStudentIds}
			options={allStudents
				.filter((s) => s.status === 'Aktif')
				.map((s) => ({ value: s.id, label: s.fullname }))}
			placeholder="Pilih Murid"
			multiple={true}
		/>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isAddStudentOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleAddStudent}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isBulkActionOpen} title="Aksi Akademik Massal">
	<div class="flex flex-col gap-6">
		<div>
			<span class="block font-label-caps text-label-caps font-bold mb-2 text-on-surface"
				>Murid Terpilih ({bulkSelectedStudentIds.length}):</span
			>
			<div class="neo-border bg-surface-container p-4 max-h-48 overflow-y-auto">
				<ul class="list-disc list-inside font-data-mono text-sm">
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

<Modal bind:isOpen={isSetHeadOpen} title={`Set Kepala Jurusan - ${major?.name ?? ''}`}>
	<div class="flex flex-col gap-4">
		<SearchableSelect
			id="head-teacher-select-detail"
			label="Guru Kepala Jurusan"
			bind:value={selectedTeacherId}
			options={allTeachers.map((t) => ({
				value: t.id,
				label: `${formatTeacherName(t)}${t.nip ? ` (${t.nip})` : ''}`
			}))}
			placeholder="Pilih Kepala Jurusan"
		/>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isSetHeadOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleSetHead}>Simpan</Button>
	{/snippet}
</Modal>


