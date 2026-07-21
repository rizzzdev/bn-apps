<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import { SearchBar } from '$lib/components/molecules';
	import { ClassDetailHeader, HomeroomTeacherCard, ClassStudentCard } from '$lib/features/class';
	import { classApi, studentApi, academicYearApi, teacherApi, majorApi } from '$lib/services';
	import type { Class, Student, ShadowClass, ShadowStudent, ShadowAcademicYear, MajorStudent, ShadowTeacher, HomeroomTeacher } from '$lib/types';
	import { Modal, SearchableSelect, TooltipIconButton } from '$lib/components/molecules';
	import { Button } from '$lib/components/atoms';
	import { toast } from '$lib/stores/toast.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { formatTeacherName } from '$lib/utils/image';

	let id = $derived($page.params.id ?? '');
	let cls = $state<Class | null>(null);
	let students = $state<Student[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	let activeYearId = $state('');
	let allStudents = $state<ShadowStudent[]>([]);
	let allYears = $state<ShadowAcademicYear[]>([]);
	let majorStudentMap = $state<Record<string, string>>({});

	// Homeroom teacher state (like major's head of department)
	let allTeachers = $state<ShadowTeacher[]>([]);
	let activeHomeroomTeacher = $state<ShadowTeacher | null>(null);
	let isSetHomeroomOpen = $state(false);
	let selectedTeacherId = $state('');

	let classMajorId = $derived(cls?.majorId ?? '');

	let filteredAddStudents = $derived(
		classMajorId
			? allStudents.filter(
					(s) =>
						s.status === 'Aktif' &&
						majorStudentMap[s.id] === classMajorId
				)
			: allStudents.filter((s) => s.status === 'Aktif')
	);

	let searchQuery = $state('');
	let visibleCount = $state(8);

	let isAddStudentOpen = $state(false);
	let addStudentIds = $state<string[]>([]);
	let addYearId = $state('');

	let isBulkActionOpen = $state(false);
	let bulkActionType = $state<'promote' | 'hold' | 'transfer' | 'graduate' | 'delete'>('promote');
	let bulkSelectedStudentIds = $state<string[]>([]);
	let activeClassStudentMap = $state<Record<string, string>>({});
	let bulkTargetClassId = $state('');

	let allClasses = $state<ShadowClass[]>([]);

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
		bulkTargetClassId = '';
		isBulkActionOpen = true;
	}

	async function handleAddStudent() {
		if (addStudentIds.length === 0) {
			toast.error('Pilih minimal 1 murid');
			return;
		}
		try {
			const payloads = addStudentIds.map((studentId) => ({
				classId: id,
				studentId,
				academicYearId: activeYearId,
				status: 'Aktif' as const
			}));
			await classApi.classStudents.bulkCreate(payloads);
			toast.success(`${payloads.length} murid berhasil ditambahkan ke kelas`);
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
		if (['promote', 'hold', 'transfer'].includes(bulkActionType) && !bulkTargetClassId) {
			toast.error('Kelas tujuan wajib diisi');
			return;
		}
		try {
			let res;
			if (
				bulkActionType === 'promote' ||
				bulkActionType === 'hold' ||
				bulkActionType === 'transfer'
			) {
				if (!bulkTargetClassId) {
					toast.error('Pilih kelas tujuan');
					return;
				}
				const payload = { studentIds: bulkSelectedStudentIds, classId: bulkTargetClassId };
				if (bulkActionType === 'promote') res = await classApi.classStudents.promote(payload);
				else if (bulkActionType === 'hold') res = await classApi.classStudents.hold(payload);
				else res = await classApi.classStudents.transfer(payload);
			} else if (bulkActionType === 'graduate') {
				res = await classApi.classStudents.graduate({ studentIds: bulkSelectedStudentIds });
			} else if (bulkActionType === 'delete') {
				const csIds = bulkSelectedStudentIds.map((id) => activeClassStudentMap[id]).filter(Boolean);
				res = await classApi.classStudents.bulkDelete(csIds);
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

	// ── Homeroom teacher functions (like major's head of department) ──
	function openSetHomeroom() {
		selectedTeacherId = activeHomeroomTeacher?.id ?? '';
		isSetHomeroomOpen = true;
	}

	async function fetchHomeroomTeacher() {
		try {
			const htRes = await teacherApi.homeroom.listByClass(id);
			if (htRes.data) {
				const activeHomeroom = (htRes.data as HomeroomTeacher[]).find(
					(h) => h.status === 'Aktif' && h.academicYearId === activeYearId
				);
				if (activeHomeroom) {
					const teacher = allTeachers.find((t) => t.id === activeHomeroom.teacherId);
					activeHomeroomTeacher = teacher ?? null;
					if (teacher && cls) {
						cls.homeroomTeacher = formatTeacherName(teacher);
						cls.homeroomTeacherNip = teacher.nip ?? '-';
					}
				} else {
					activeHomeroomTeacher = null;
				}
			}
		} catch {
			activeHomeroomTeacher = null;
		}
	}

	async function handleSetHomeroom() {
		if (!selectedTeacherId) {
			toast.error('Pilih wali kelas terlebih dahulu');
			return;
		}
		try {
			const res = await teacherApi.homeroom.create({
				classId: id,
				teacherId: selectedTeacherId,
				academicYearId: activeYearId,
				status: 'Aktif'
			});
			toast.success(res.message || 'Wali kelas berhasil diperbarui');
			isSetHomeroomOpen = false;
			await fetchHomeroomTeacher();
		} catch {
			toast.error('Gagal memperbarui wali kelas');
		}
	}
	// ── End homeroom functions ──

	async function fetchStudents() {
		if (!id || !activeYearId) return;
		const csRes = await classApi.classStudents.list(1, 1000);
		if (csRes.data) {
			const activeClassStudents = csRes.data.filter(
				(cs) => cs.classId === id && cs.academicYearId === activeYearId && cs.status === 'Aktif'
			);
			activeClassStudentMap = activeClassStudents.reduce(
				(acc, cs) => {
					acc[cs.studentId] = cs.id;
					return acc;
				},
				{} as Record<string, string>
			);

			const studentIds = new Set(activeClassStudents.map((cs) => cs.studentId));

			students = activeClassStudents
				.map((cs) => allStudents.find((s) => s.id === cs.studentId))
				.filter(Boolean)
				.map((s) => ({
					id: s!.id,
					fullname: s!.fullname,
					nis: s!.nis ?? '-',
					nisn: s!.nisn ?? '-',
					classId: id,
					className: cls?.name ?? '-',
					majorId: '-',
					majorName: '-',
					academicYearId: activeYearId,
					status: 'Aktif',
					pictureUrl: s!.pictureUrl ?? null,
					photoUrl: s!.pictureUrl ?? undefined
				}))
				.reverse();
		}

		if (cls) {
			cls.totalStudents = students.length;
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
			const [classRes, studentListRes, yearsRes, allClassRes, teacherRes] = await Promise.all([
				classApi.getById(id),
				studentApi.list(1, 1000),
				academicYearApi.list(1, 100),
				classApi.list(1, 100),
				teacherApi.list(1, 1000)
			]);

			// Fetch major info to get majorCode
			const c = classRes.data as ShadowClass | null;
			let majorCode = '-';
			if (c?.majorId) {
				try {
					const majorRes = await majorApi.getById(c.majorId);
					if (majorRes.data) {
						majorCode = (majorRes.data as { code: string }).code;
					}
				} catch {
					// Non-critical
				}
			}

			if (teacherRes.data) {
				allTeachers = teacherRes.data as ShadowTeacher[];
			}

			if (allClassRes.data) {
				allClasses = allClassRes.data as ShadowClass[];
			}

			if (yearsRes.data) {
				allYears = yearsRes.data as ShadowAcademicYear[];
				const activeYear = allYears.find((y) => y.status === 'Aktif');
				if (activeYear) activeYearId = activeYear.id;
			}

			if (classRes.data) {
				cls = {
					id: c!.id,
					majorId: c!.majorId,
					majorCode,
					name: c!.name,
					totalStudents: 0,
					homeroomTeacher: '-',
					homeroomTeacherNip: '-',
					academicYear: '-',
					semester: 1
				};
			}

			if (studentListRes.data) {
				allStudents = studentListRes.data as ShadowStudent[];
			}

			// Load major-student map for filtering by class major
			try {
				const msRes = await majorApi.majorStudents.list(1, 10000);
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
			} catch {
				// Non-critical, student dropdown will show all active students
			}

			await fetchStudents();
			await fetchHomeroomTeacher();
		} catch (e) {
			error = String(e);
		} finally {
			isLoading = false;
		}
	});
</script>

<div class="container mx-auto px-4 py-8">
{#if isLoading}
	<div class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono">
		Memuat data...
	</div>
{:else if error}
	<div class="text-center py-xl">
		<h2 class="font-headline-md text-headline-md text-error">Gagal memuat data</h2>
		<p class="font-data-mono text-data-mono text-on-surface-variant mt-2">{error}</p>
		<a href="/class-students" class="font-data-mono text-data-mono text-primary underline mt-4 inline-block"
			>Kembali ke daftar kelas</a
		>
	</div>
{:else if cls}
	<ClassDetailHeader {cls} />

	<div class="flex flex-col gap-12 mt-8">
		<!-- Wali Kelas section (like major's Kepala Jurusan) -->
		<div class="flex flex-col gap-4">
			<div class="neo-border-b pb-4 w-full">
				<h3 class="font-headline-md text-xl sm:text-headline-lg font-bold">Wali Kelas</h3>
			</div>
			<div class="flex justify-end items-center gap-2 w-full">
				<TooltipIconButton icon="history" tooltip="Riwayat Wali Kelas" onclick={() => goto(`/class-students/${id}/homeroom-history`)} />
				<TooltipIconButton icon="admin_panel_settings" tooltip="Set Wali Kelas" onclick={openSetHomeroom} />
			</div>
			<div class="flex justify-center">
				<HomeroomTeacherCard teacherData={activeHomeroomTeacher} />
			</div>
		</div>

		<div class="flex flex-col">
			<div class="flex items-center gap-4 mb-4 neo-border-b pb-4 w-full">
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
					<TooltipIconButton icon="school" tooltip="Riwayat Alumni & Murid" onclick={() => goto(`/class-students/${id}/alumni`)} />
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
					<ClassStudentCard
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
		<h2 class="font-headline-md text-headline-md text-error">Kelas tidak ditemukan</h2>
		<a href="/class-students" class="font-data-mono text-data-mono text-primary underline mt-4 inline-block"
			>Kembali ke daftar kelas</a
		>
	</div>
{/if}
</div>

<Modal bind:isOpen={isAddStudentOpen} title="Tambah Murid ke Kelas">
	<div class="flex flex-col gap-4">		<SearchableSelect
			id="student"
			label="Murid"
			bind:value={addStudentIds}
			options={filteredAddStudents.map((s) => ({ value: s.id, label: s.fullname }))}
			placeholder="Pilih Murid"
			multiple={true}
		/>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isAddStudentOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleAddStudent}>Simpan</Button>
	{/snippet}
</Modal>

<Modal bind:isOpen={isSetHomeroomOpen} title={`Set Wali Kelas - ${cls?.name ?? ''}`}>
	<div class="flex flex-col gap-4">
		<SearchableSelect
			id="head-teacher-select-detail"
			label="Guru Wali Kelas"
			bind:value={selectedTeacherId}
			options={allTeachers.map((t) => ({
				value: t.id,
				label: `${formatTeacherName(t)}${t.nip ? ` (${t.nip})` : ''}`
			}))}
			placeholder="Pilih Wali Kelas"
		/>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isSetHomeroomOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleSetHomeroom}>Simpan</Button>
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
				{ value: 'promote', label: 'Naik Kelas' },
				{ value: 'hold', label: 'Tinggal Kelas' },
				{ value: 'transfer', label: 'Pindah Kelas' },
				{ value: 'graduate', label: 'Lulus' },
				{ value: 'delete', label: 'Keluarkan dari Kelas (Hapus)' }
			]}
			searchThreshold={10}
		/>
		{#if bulkActionType === 'promote' || bulkActionType === 'hold' || bulkActionType === 'transfer'}
			<SearchableSelect
				id="bulk-target-class"
				label="Kelas Tujuan"
				bind:value={bulkTargetClassId}
				options={allClasses.filter((c) => c.id !== id).map((c) => ({ value: c.id, label: c.name }))}
				placeholder="Pilih Kelas Tujuan"
				multiple={false}
			/>
		{/if}
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isBulkActionOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleBulkAction}>Proses</Button>
	{/snippet}
</Modal>
