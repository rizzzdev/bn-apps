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
	import { classApi, studentApi, academicYearApi, teacherApi, majorApi } from '$lib/services';
	import type {
		Class,
		ShadowClass,
		ShadowStudent,
		ShadowAcademicYear,
		MajorStudent,
		ShadowTeacher,
		HomeroomTeacher
	} from '$lib/types';
	import { toast } from '$lib/stores/toast.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let id = $derived($page.params.id ?? '');
	let cls = $state<Class | null>(null);
	let students = $state<ShadowStudent[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	let activeYearId = $state('');
	let allStudents = $state<ShadowStudent[]>([]);
	let allYears = $state<ShadowAcademicYear[]>([]);
	let majorStudentMap = $state<Record<string, string>>({});
	let availableAddStudents = $state<ShadowStudent[]>([]);

	let allTeachers = $state<ShadowTeacher[]>([]);
	let activeHomeroomTeacher = $state<ShadowTeacher | null>(null);
	let isSetHomeroomOpen = $state(false);
	let selectedTeacherId = $state('');

	let classMajorId = $derived(cls?.majorId ?? '');

	let filteredAddStudents = $derived(
		classMajorId
			? availableAddStudents.filter((s) => majorStudentMap[s.id] === classMajorId)
			: availableAddStudents
	);

	let searchQuery = $state('');

	let isAddStudentOpen = $state(false);
	let addStudentIds = $state<string[]>([]);

	let isBulkActionOpen = $state(false);
	let bulkActionType = $state<'promote' | 'hold' | 'transfer' | 'graduate' | 'delete'>('promote');
	let bulkSelectedStudentIds = $state<string[]>([]);
	let activeClassStudentMap = $state<Record<string, string>>({});
	let bulkTargetClassId = $state('');

	let allClasses = $state<ShadowClass[]>([]);

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
				excludeWithClass: 'true',
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
		} catch {
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
		} catch {
			toast.error('Gagal memproses aksi akademik');
		}
	}

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

			students = activeClassStudents
				.map((cs) => allStudents.find((s) => s.id === cs.studentId))
				.filter(Boolean) as ShadowStudent[];
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
			const yearsRes = await academicYearApi.list(1, 100);
			if (yearsRes.data) {
				allYears = yearsRes.data as ShadowAcademicYear[];
				const activeYear = allYears.find((y) => y.status === 'Aktif');
				if (activeYear) activeYearId = activeYear.id;
			}

			const [classRes, studentListRes, allClassRes, teacherRes] = await Promise.all([
				classApi.getById(id),
				studentApi.list(1, 1000),
				classApi.list(1, 100),
				teacherApi.list(1, 1000)
			]);

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
				// Non-critical
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

<svelte:head>
	<title>{cls ? `${cls.name} - Akademik-BN` : 'Detail Kelas - Akademik-BN'}</title>
</svelte:head>

<div class="flex flex-col gap-6">
	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-xs">Memuat data...</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 text-center font-data-mono text-xs">
			<h2 class="font-headline-md text-lg text-error">Terjadi Kesalahan</h2>
			<p class="font-data-mono text-xs text-on-surface-variant mt-2">{error}</p>
			<a
				href="/class-students"
				class="font-data-mono text-xs text-primary underline mt-4 inline-block"
			>
				Kembali ke daftar kelas
			</a>
		</div>
	{:else if cls}
		<DetailHeader
			title="Detail Kelas"
			name={cls.name}
			code={cls.majorCode}
			backHref="/class-students"
		/>

		<div class="flex flex-col gap-8">
			<!-- Homeroom Leader Section -->
			<div class="flex flex-col gap-3">
				<div class="flex items-center justify-between border-b-2 pb-2">
					<h3 class="font-headline-md text-lg font-bold">Wali Kelas</h3>
					<div class="flex items-center gap-2">
						<TooltipIconButton
							icon="history"
							tooltip="Riwayat Wali Kelas"
							onclick={() => goto(`/class-students/${id}/homeroom-history`)}
						/>
						<TooltipIconButton
							icon="admin_panel_settings"
							tooltip="Set Wali Kelas"
							onclick={openSetHomeroom}
						/>
					</div>
				</div>
				<div class="flex justify-center md:justify-start">
					<LeaderCard
						leaderData={activeHomeroomTeacher}
						roleTitle="Wali Kelas"
						emptyTitle="Belum ada Wali Kelas"
						onAssign={openSetHomeroom}
					/>
				</div>
			</div>

			<!-- Student Section -->
			<div class="flex flex-col gap-3">
				<div class="flex items-center gap-3 border-b-2 pb-2">
					<h3 class="font-headline-md text-lg font-bold">Daftar Murid</h3>
					<span
						class="border-2 border-on-background bg-primary-fixed text-on-background px-2 py-0.5 font-bold font-data-mono neo-shadow-xs text-xs"
					>
						{students.length} Murid
					</span>
				</div>

				<div
					class="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full mb-2"
				>
					<div class="w-full sm:w-64">
						<SearchBar bind:value={searchQuery} placeholder="Cari NIS/Nama..." class="w-full" />
					</div>
					<div class="flex items-center gap-2">
						<TooltipIconButton
							icon="school"
							tooltip="Riwayat Alumni & Murid"
							onclick={() => goto(`/class-students/${id}/alumni`)}
						/>
						<TooltipIconButton
							icon={bulkSelectedStudentIds.length === filteredStudents.length &&
							filteredStudents.length > 0
								? 'deselect'
								: 'checklist'}
							tooltip={bulkSelectedStudentIds.length === filteredStudents.length &&
							filteredStudents.length > 0
								? 'Batal Pilih Semua'
								: 'Pilih Semua'}
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
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max"
				>
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
	title="Tambah Murid ke Kelas"
	showTargetSelect={false}
	bind:selectedStudentIds={addStudentIds}
	students={filteredAddStudents}
	onSave={handleAddStudent}
/>

<AssignTeacherModal
	bind:isOpen={isSetHomeroomOpen}
	title={`Set Wali Kelas - ${cls?.name ?? ''}`}
	label="Guru Wali Kelas"
	bind:selectedTeacherId
	teachers={allTeachers}
	onSave={handleSetHomeroom}
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
