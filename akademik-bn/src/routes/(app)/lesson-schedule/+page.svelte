<script lang="ts">
	import { Icon, Button } from '$lib/components/atoms';
	import {
		PageHeader,
		Modal,
		SearchableSelect,
		TooltipIconButton,
		TimetableGridTable
	} from '$lib/components/molecules';
	import type { TimetableCellSlot } from '$lib/components/molecules';
	import {
		lessonScheduleApi,
		subjectApi,
		teacherApi,
		classApi,
		lessonHourApi
	} from '$lib/services';
	import type {
		LessonSchedule,
		ShadowSubject,
		ShadowTeacher,
		ShadowClass,
		LessonHour,
		SubjectTeacher
	} from '$lib/types';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatTeacherName } from '$lib/utils/image';
	import { WORK_DAYS } from '$lib/constants';

	const days = WORK_DAYS;

	let allSubjects = $state<ShadowSubject[]>([]);
	let allTeachers = $state<ShadowTeacher[]>([]);
	let allClasses = $state<ShadowClass[]>([]);
	let allLessonHours = $state<LessonHour[]>([]);
	let schedules = $state<LessonSchedule[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	// Subject-teacher mapping for teacher filtering
	let subjectTeachers = $state<SubjectTeacher[]>([]);

	// Filters
	let filterClassId = $state('');
	let filterTeacherId = $state('');

	// Create modal
	let isCreateOpen = $state(false);
	let formSubjectId = $state('');
	let formLessonHourIds = $state<string[]>([]);
	let formDay = $state('Senin');
	let formNotes = $state('');
	let formTeacherIds = $state<string[]>([]);
	let formClassIds = $state<string[]>([]);
	let isSaving = $state(false);

	// Delete
	let isBulkDeleteOpen = $state(false);
	let selectedIds = $state<string[]>([]);

	// Derived data
	let filteredSchedules = $derived.by(() => {
		let result = schedules;
		if (filterClassId)
			result = result.filter((s) => s.classes.some((c) => c.class.id === filterClassId));
		if (filterTeacherId)
			result = result.filter((s) => s.teachers.some((t) => t.teacher.id === filterTeacherId));
		return result;
	});

	let gridSlots = $derived.by<TimetableCellSlot[]>(() => {
		return filteredSchedules
			.filter((s) => s.deletedAt === null)
			.map((s) => ({
				id: s.id,
				subjectName: getSubjectName(s.subjectId),
				day: s.day,
				lessonHourId: s.lessonHourId,
				teachers: s.teachers.map((t) => ({ id: t.teacher.id, name: formatTeacherName(t.teacher) })),
				classes: s.classes.map((c) => ({ id: c.class.id, name: c.class.name })),
				notes: s.notes
			}));
	});

	let allIds = $derived(filteredSchedules.map((s) => s.id));
	let totalSelected = $derived(selectedIds.length);
	let allSelected = $derived(allIds.length > 0 && totalSelected === allIds.length);

	let sortedAllHours = $derived([...allLessonHours].sort((a, b) => a.order - b.order));

	// Teachers who teach the selected subject (for form)
	let teachersForSubject = $derived.by(() => {
		if (!formSubjectId) return [];
		const teacherIds = subjectTeachers
			.filter((st) => st.subjectId === formSubjectId && st.status === 'Aktif')
			.map((st) => st.teacherId);
		return allTeachers.filter((t) => teacherIds.includes(t.id) && t.status === 'Aktif');
	});

	function getSubjectName(id: string): string {
		const s = allSubjects.find((s) => s.id === id);
		return s ? s.name : id;
	}

	function toggleSelect(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((i) => i !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function selectAll() {
		if (allSelected) {
			selectedIds = [];
		} else {
			selectedIds = [...allIds];
		}
	}

	async function loadData() {
		isLoading = true;
		error = '';
		try {
			const [scheduleRes, subjectRes, teacherRes, classRes, lessonHourRes, stRes] =
				await Promise.all([
					lessonScheduleApi.list(1, 200),
					subjectApi.list(1, 200),
					teacherApi.list(1, 200),
					classApi.list(1, 200),
					lessonHourApi.list(1, 50),
					teacherApi.subjectTeachers.list(1, 200)
				]);

			if (subjectRes.data) allSubjects = subjectRes.data as ShadowSubject[];
			if (teacherRes.data) allTeachers = teacherRes.data as ShadowTeacher[];
			if (classRes.data) allClasses = classRes.data as ShadowClass[];
			if (lessonHourRes.data) allLessonHours = lessonHourRes.data as LessonHour[];
			if (scheduleRes.data) schedules = scheduleRes.data as LessonSchedule[];
			if (stRes.data) subjectTeachers = stRes.data as SubjectTeacher[];
		} catch (e) {
			error = String(e);
			toast.error('Gagal memuat data');
		} finally {
			isLoading = false;
		}
	}

	async function loadSchedules() {
		try {
			const params: Record<string, string> = {};
			if (filterClassId) params.classId = filterClassId;
			if (filterTeacherId) params.teacherId = filterTeacherId;
			const res = await lessonScheduleApi.list(1, 200, params);
			if (res.data) schedules = res.data as LessonSchedule[];
		} catch {
			toast.error('Gagal memuat jadwal');
		}
	}

	// Create
	function openCreate() {
		formSubjectId = '';
		formLessonHourIds = [];
		formDay = 'Senin';
		formNotes = '';
		formTeacherIds = [];
		formClassIds = [];
		isCreateOpen = true;
	}

	async function handleCreate() {
		if (!formSubjectId) {
			toast.error('Pilih mata pelajaran');
			return;
		}
		if (formLessonHourIds.length === 0) {
			toast.error('Pilih minimal 1 jam pelajaran');
			return;
		}
		if (formTeacherIds.length === 0) {
			toast.error('Pilih minimal 1 guru');
			return;
		}
		if (formClassIds.length === 0) {
			toast.error('Pilih minimal 1 kelas');
			return;
		}

		isSaving = true;
		try {
			const items = formLessonHourIds.map((lhId) => ({
				subjectId: formSubjectId,
				lessonHourId: lhId,
				day: formDay,
				notes: formNotes || undefined,
				teacherIds: formTeacherIds,
				classIds: formClassIds
			}));

			if (items.length === 1) {
				await lessonScheduleApi.create(items[0]);
			} else {
				await lessonScheduleApi.bulkCreate(items);
			}

			toast.success(`${items.length} jadwal berhasil ditambahkan`);
			isCreateOpen = false;
			await loadSchedules();
		} catch (e: any) {
			const msg = e?.message || 'Gagal menyimpan jadwal';
			toast.error(msg);
		} finally {
			isSaving = false;
		}
	}

	// Bulk delete
	function openBulkDelete() {
		if (selectedIds.length === 0) {
			toast.error('Pilih jadwal terlebih dahulu');
			return;
		}
		isBulkDeleteOpen = true;
	}

	async function handleBulkDelete() {
		try {
			await lessonScheduleApi.bulkDelete(selectedIds);
			toast.success(`${selectedIds.length} jadwal berhasil dihapus`);
			isBulkDeleteOpen = false;
			selectedIds = [];
			await loadSchedules();
		} catch {
			toast.error('Gagal menghapus jadwal');
		}
	}

	$effect(() => {
		const _ = [filterClassId, filterTeacherId];
		if (!isLoading) loadSchedules();
	});

	onMount(() => {
		loadData();
	});
</script>

<svelte:head>
	<title>Jadwal Pelajaran - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-6 min-w-0 max-w-full">
	<PageHeader title="Jadwal Pelajaran" description="MANAJEMEN JADWAL PELAJARAN" />

	<!-- Filters: Kelas & Guru only -->
	<div class="neo-border bg-surface p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
		<SearchableSelect
			id="filter-class"
			label="Filter Kelas"
			bind:value={filterClassId}
			options={[
				{ value: '', label: 'Semua Kelas' },
				...allClasses.map((c) => ({ value: c.id, label: c.name }))
			]}
			placeholder="Semua Kelas"
		/>
		<SearchableSelect
			id="filter-teacher"
			label="Filter Guru"
			bind:value={filterTeacherId}
			options={[
				{ value: '', label: 'Semua Guru' },
				...allTeachers.map((t) => ({ value: t.id, label: formatTeacherName(t) }))
			]}
			placeholder="Semua Guru"
		/>
	</div>

	<!-- Toolbar -->
	<div class="flex flex-row items-center justify-end gap-2">
		<TooltipIconButton icon="print" tooltip="Cetak Jadwal" href="/lesson-schedule/print" />
		<TooltipIconButton
			icon="calendar_cog"
			tooltip="Generator Jadwal (CSP Backtracking)"
			href="/lesson-schedule/generator"
			variant="primary"
		/>
		<TooltipIconButton
			icon={allSelected ? 'deselect' : 'checklist'}
			tooltip={allSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
			onclick={selectAll}
		/>
		{#if totalSelected > 0}
			<TooltipIconButton
				icon="delete"
				tooltip={`Hapus (${totalSelected})`}
				onclick={openBulkDelete}
				badgeCount={totalSelected}
				variant="danger"
			/>
		{/if}
		<TooltipIconButton icon="add" tooltip="Tambah Jadwal" onclick={openCreate} variant="primary" />
	</div>

	<!-- Loading / Error -->
	{#if isLoading}
		<div class="neo-border bg-surface p-8 text-center font-data-mono text-data-mono">
			Memuat data...
		</div>
	{:else if error}
		<div class="neo-border bg-error-container text-error p-4 font-data-mono text-data-mono">
			{error}
		</div>
	{:else}
		<TimetableGridTable
			hours={sortedAllHours}
			days={days as unknown as string[]}
			slots={gridSlots}
			{selectedIds}
			selectable={true}
			onToggleSelect={toggleSelect}
		/>
	{/if}
</div>

<!-- Create Modal (scrollable) -->
<Modal bind:isOpen={isCreateOpen} title="Tambah Jadwal Pelajaran">
	<div class="flex flex-col gap-4 overflow-y-auto max-h-[55vh] pr-1">
		<SearchableSelect
			id="create-subject"
			label="Mata Pelajaran"
			bind:value={formSubjectId}
			options={allSubjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
			placeholder="Pilih Mapel"
		/>
		<SearchableSelect
			id="create-day"
			label="Hari"
			bind:value={formDay}
			options={days.map((d) => ({ value: d, label: d }))}
			placeholder="Pilih Hari"
		/>
		<div class="neo-border bg-surface-container p-3">
			<p class="font-label-caps text-label-caps uppercase text-on-surface-variant mb-1">
				<Icon name="schedule" size="14px" class="inline mr-1" />Jam Pelajaran
			</p>
			<p class="text-xs text-on-surface-variant mb-2">
				Pilih 1 atau lebih untuk blok jam (bulk create)
			</p>
			<SearchableSelect
				id="create-lesson-hour"
				label=""
				bind:value={formLessonHourIds}
				options={sortedAllHours.map((lh) => ({
					value: lh.id,
					label: `${lh.name} (${lh.startTime} - ${lh.endTime})`
				}))}
				placeholder="Pilih Jam"
				multiple={true}
			/>
		</div>
		<div class="flex flex-col gap-1">
			<label
				class="font-label-caps text-xs uppercase font-bold text-on-surface-variant"
				for="create-notes">Catatan (opsional)</label
			>
			<input
				id="create-notes"
				type="text"
				bind:value={formNotes}
				placeholder="Misal: Team teaching / Kelas gabungan"
				class="w-full bg-surface-container-lowest neo-border h-8 px-3 font-data-mono text-xs text-on-background focus:outline-none focus:shadow-[4px_4px_0px_0px_#1C1B1B] transition-shadow"
			/>
		</div>

		<div class="neo-border bg-surface-container p-3">
			<p class="font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">
				<Icon name="group" size="14px" class="inline mr-1" />Guru (Team Teaching)
			</p>
			<p class="text-xs text-on-surface-variant mb-2">
				{#if !formSubjectId}
					Pilih mata pelajaran terlebih dahulu
				{:else if teachersForSubject.length === 0}
					Tidak ada guru yang mengajar mapel ini
				{:else}
					Pilih lebih dari 1 guru untuk team teaching
				{/if}
			</p>
			<SearchableSelect
				id="create-teachers"
				label=""
				bind:value={formTeacherIds}
				options={teachersForSubject.map((t) => ({ value: t.id, label: formatTeacherName(t) }))}
				placeholder={formSubjectId ? 'Pilih Guru' : 'Pilih mapel dulu'}
				multiple={true}
			/>
		</div>

		<div class="neo-border bg-surface-container p-3">
			<p class="font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">
				<Icon name="school" size="14px" class="inline mr-1" />Kelas (Batch Teaching)
			</p>
			<p class="text-xs text-on-surface-variant mb-2">
				Pilih lebih dari 1 kelas untuk batch teaching (kelas gabungan)
			</p>
			<SearchableSelect
				id="create-classes"
				label=""
				bind:value={formClassIds}
				options={allClasses.map((c) => ({ value: c.id, label: c.name }))}
				placeholder="Pilih Kelas"
				multiple={true}
			/>
		</div>
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isCreateOpen = false)} disabled={isSaving}>Batal</Button
		>
		<Button variant="primary" onclick={handleCreate} disabled={isSaving}>
			{isSaving ? 'Menyimpan...' : 'Simpan'}
		</Button>
	{/snippet}
</Modal>

<!-- Bulk Delete Confirmation -->
<Modal bind:isOpen={isBulkDeleteOpen} title="Konfirmasi Hapus Massal">
	<p class="font-body-md text-body-md">
		Yakin ingin menghapus <strong>{totalSelected}</strong> jadwal pelajaran?
	</p>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => (isBulkDeleteOpen = false)}>Batal</Button>
		<Button variant="primary" onclick={handleBulkDelete}>Hapus Semua</Button>
	{/snippet}
</Modal>
