<script lang="ts">
  import { Icon, Button, Checkbox } from '$lib/components/atoms';
  import { PageHeader, Modal, SearchableSelect, TimetableGridTable, TooltipIconButton } from '$lib/components/molecules';
  import type { TimetableCellSlot } from '$lib/components/molecules';
  import {
    classApi,
    subjectApi,
    teacherApi,
    lessonHourApi,
    classSubjectRequirementApi,
    teacherUnavailabilityApi,
    timetableGeneratorApi,
    scheduleEventApi,
  } from '$lib/services';
  import type {
    ShadowClass,
    ShadowSubject,
    ShadowTeacher,
    LessonHour,
    SubjectTeacher,
    ClassSubjectRequirement,
    TeacherUnavailability,
    GeneratorPreviewResult,
    ScheduleEvent,
  } from '$lib/types';
  import { onMount, onDestroy } from 'svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { formatTeacherName } from '$lib/utils/image';
  import { expandEventsToSlots } from '$lib/utils/schedule-event';
  import { WORK_DAYS } from '$lib/constants';

  const days = WORK_DAYS;

  // Active Tab
  let activeTab = $state<'requirements' | 'unavailability' | 'run' | 'preview'>('requirements');

  // Master Data
  let allClasses = $state<ShadowClass[]>([]);
  let allSubjects = $state<ShadowSubject[]>([]);
  let allTeachers = $state<ShadowTeacher[]>([]);
  let allLessonHours = $state<LessonHour[]>([]);
  let subjectTeachers = $state<SubjectTeacher[]>([]);
  let allEvents = $state<ScheduleEvent[]>([]);
  let isLoadingMaster = $state(true);

  // Tab 1: Requirements State
  let selectedRequirementClassId = $state<string>('');
  // Local type: one row per subject, multiple teachers via teacherIds
  interface SubjectRequirementRow {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    teacherIds: string[];
    existingIds: string[];
    weeklyHours: number;
    maxHoursPerDay: number;
  }

  let requirements = $state<SubjectRequirementRow[]>([]);
  let allClassRequirements = $state<ClassSubjectRequirement[]>([]);
  let selectedReqIds = $state<string[]>([]);
  let isBulkDeleteReqOpen = $state(false);
  let isClearAllReqOpen = $state(false);

  // Create Mapping Modal
  let isCreateMappingOpen = $state(false);
  let createSubjectId = $state('');
  let createWeeklyHours = $state(2);
  let createMaxHoursPerDay = $state(2);
  let createTeacherIds = $state<string[]>([]);
  let createClassIds = $state<string[]>([]);
  let isCreatingMapping = $state(false);

  function openCreateMapping() {
    createSubjectId = '';
    createWeeklyHours = 2;
    createMaxHoursPerDay = 2;
    createTeacherIds = [];
    createClassIds = selectedRequirementClassId ? [selectedRequirementClassId] : [];
    isCreateMappingOpen = true;
  }

  // Tab 2: Teacher Unavailability State
  let selectedTeacherId = $state<string>('');
  let teacherUnavailabilities = $state<TeacherUnavailability[]>([]);
  let blockedSlotKeys = $state<Set<string>>(new Set()); // `${day}_${lessonHourId}`
  let isSavingUnavailability = $state(false);
  let selectedUnavailHourIds = $state<string[]>([]);
  let isBulkDeleteUnavailOpen = $state(false);

  // Tab 3: Run Engine State
  let selectedWorkingDays = $state<string[]>(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
  let timeoutMs = $state<number>(15000);
  let enableBatchTeaching = $state(true);
  let isGenerating = $state(false);
  let generateElapsed = $state(0);
  let generateTimer: ReturnType<typeof setInterval> | null = null;

  // Bersihkan timer jika halaman ditutup di tengah proses generasi.
  onDestroy(() => {
    if (generateTimer) {
      clearInterval(generateTimer);
      generateTimer = null;
    }
  });

  // Tab 4: Preview Result State
  let previewResult = $state<GeneratorPreviewResult | null>(null);
  let previewMode = $state<'class' | 'teacher'>('class');
  let selectedPreviewClassId = $state<string>('');
  let selectedPreviewTeacherId = $state<string>('');
  let isPublishing = $state(false);
  let isPublishModalOpen = $state(false);

  // Derived Sorted Lesson Hours
  let sortedLessonHours = $derived([...allLessonHours].sort((a, b) => a.order - b.order));

  // Derived Preview Grid Slots for TimetableGridTable component
  let previewEventSlots = $derived.by<TimetableCellSlot[]>(() =>
    expandEventsToSlots(allEvents, allLessonHours)
  );

  let previewGridSlots = $derived.by<TimetableCellSlot[]>(() => {
    const lessonSlots: TimetableCellSlot[] = previewResult
      ? previewResult.schedules
          .filter((s) => {
            if (previewMode === 'class') {
              return (s.classIds || [s.classId]).includes(selectedPreviewClassId);
            } else {
              return (s.teacherIds || [s.teacherId]).includes(selectedPreviewTeacherId);
            }
          })
          .map((s) => {
            const teacherList = s.teacherIds
              ? s.teacherIds.map((tid, i) => ({ id: tid, name: (s.teacherNames || [])[i] || s.teacherName }))
              : [{ id: s.teacherId, name: s.teacherName }];
            const classList = s.classIds
              ? s.classIds.map((cid, i) => ({ id: cid, name: (s.classNames || [])[i] || s.className }))
              : [{ id: s.classId, name: s.className }];
            return {
              id: `${(s.classIds || [s.classId]).join(',')}_${(s.teacherIds || [s.teacherId]).join(',')}_${s.day}_${s.lessonHourId}`,
              subjectName: s.subjectName,
              day: s.day,
              lessonHourId: s.lessonHourId,
              teachers: teacherList,
              classes: classList,
            };
          })
      : [];
    return [...lessonSlots, ...previewEventSlots];
  });

  // Load all master data
  onMount(async () => {
    try {
      isLoadingMaster = true;
      const [classRes, subjectRes, teacherRes, hourRes, stRes, reqRes, eventRes] =
        await Promise.all([
          classApi.list(1, 200),
          subjectApi.list(1, 200),
          teacherApi.list(1, 200),
          lessonHourApi.list(1, 50),
          teacherApi.subjectTeachers.list(1, 500),
          classSubjectRequirementApi.list({}),
          scheduleEventApi.list(1, 200),
        ]);

      if (classRes.data) allClasses = classRes.data as ShadowClass[];
      if (subjectRes.data) allSubjects = subjectRes.data as ShadowSubject[];
      if (teacherRes.data) allTeachers = teacherRes.data as ShadowTeacher[];
      if (hourRes.data) allLessonHours = hourRes.data as LessonHour[];
      if (stRes.data) subjectTeachers = stRes.data as SubjectTeacher[];
      if (reqRes.data) allClassRequirements = reqRes.data as ClassSubjectRequirement[];
      if (eventRes.data) allEvents = eventRes.data as ScheduleEvent[];

      if (allClasses.length > 0) {
        selectedRequirementClassId = allClasses[0]!.id;
        selectedPreviewClassId = allClasses[0]!.id;
      }
      if (allTeachers.length > 0) {
        selectedTeacherId = allTeachers[0]!.id;
        selectedPreviewTeacherId = allTeachers[0]!.id;
      }
    } catch {
      toast.error('Gagal memuat data master');
    } finally {
      isLoadingMaster = false;
    }
  });

  // Filter teachers for a specific subject (from SubjectTeacher records)
  function getTeachersForSubject(subjectId: string): ShadowTeacher[] {
    if (!subjectId || subjectTeachers.length === 0) return allTeachers;

    const teacherIds = subjectTeachers
      .filter((st) => st.subjectId === subjectId && st.status === 'Aktif')
      .map((st) => st.teacherId);

    const filtered = allTeachers.filter((t) => teacherIds.includes(t.id));
    return filtered.length > 0 ? filtered : allTeachers;
  }

  // Check if any teacher is over-allocated and trigger error toast
  function checkOverAllocatedTeachers(): boolean {
    const combinedMap = new Map<string, ClassSubjectRequirement>();
    for (const r of allClassRequirements) {
      combinedMap.set(`${r.classId}_${r.subjectId}_${r.teacherId || ''}`, r);
    }
    for (const r of requirements) {
      for (const tId of r.teacherIds) {
        const key = `${selectedRequirementClassId}_${r.subjectId}_${tId}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, { classId: selectedRequirementClassId, subjectId: r.subjectId, teacherId: tId, weeklyHours: r.weeklyHours } as ClassSubjectRequirement);
        }
      }
    }

    const assignedTeacherIds = new Set<string>();
    for (const req of combinedMap.values()) {
      if (req.teacherId && req.weeklyHours > 0) {
        assignedTeacherIds.add(req.teacherId);
      }
    }

    for (const tId of assignedTeacherIds) {
      const teacherObj = allTeachers.find((t) => t.id === tId);
      if (!teacherObj) continue;

      const stRecords = subjectTeachers.filter((st) => st.teacherId === tId && st.status === 'Aktif');

      // Per-subject max "per single class" weekly hours (batch/team teaching tidak dikalikan jumlah kelas).
      const perSubjectMax = new Map<string, number>();
      for (const r of Array.from(combinedMap.values()).filter((r) => r.teacherId === tId)) {
        const current = perSubjectMax.get(r.subjectId) ?? 0;
        perSubjectMax.set(r.subjectId, Math.max(current, r.weeklyHours || 0));
      }

      // 1. Check per-subject target hours overload (per single class)
      for (const st of stRecords) {
        const allocatedForSubject = perSubjectMax.get(st.subjectId) || 0;
        const targetForSubject = st.targetHours || 0;

        if (allocatedForSubject > targetForSubject) {
          toast.error(`Guru ${formatTeacherName(teacherObj)} melebihi batas beban mengajar per kelas! (Dialokasikan: ${allocatedForSubject} JP, Target Beban: ${targetForSubject} JP)`);
          return true;
        }
      }

      // 2. Check total teacher target hours overload (per class per subject)
      const totalAllocated = Array.from(perSubjectMax.values()).reduce((sum, v) => sum + v, 0);
      const totalTarget = stRecords.reduce((sum, st) => sum + (st.targetHours || 0), 0);

      if (totalAllocated > totalTarget) {
        toast.error(`Guru ${formatTeacherName(teacherObj)} melebihi total batas beban mengajar! (Total Dialokasikan: ${totalAllocated} JP, Total Target Beban: ${totalTarget} JP)`);
        return true;
      }
    }
    return false;
  }

  // Reactive effect for Requirement Class selection
  $effect(() => {
    if (selectedRequirementClassId && !isLoadingMaster) {
      loadRequirementsForClass(selectedRequirementClassId);
    }
  });

  // Reactive effect for Teacher Unavailability selection
  $effect(() => {
    if (selectedTeacherId && !isLoadingMaster) {
      loadTeacherUnavailabilities(selectedTeacherId);
    }
  });

  async function handleCreateMapping() {
    if (!createSubjectId) { toast.error('Pilih mata pelajaran'); return; }
    if (createTeacherIds.length === 0) { toast.error('Pilih minimal satu guru pengampu'); return; }
    if (createClassIds.length === 0) { toast.error('Pilih minimal satu kelas'); return; }

    isCreatingMapping = true;
    try {
      for (const tId of createTeacherIds) {
        try {
          await teacherApi.subjectTeachers.create({
            teacherId: tId,
            subjectId: createSubjectId,
            targetHours: createWeeklyHours,
            status: 'Aktif' as const,
          });
        } catch (_) {
          // Abaikan error jika mapping sudah ada secara global
        }
      }

      const payloads = [];
      for (const cId of createClassIds) {
        for (const tId of createTeacherIds) {
          payloads.push({
            classId: cId,
            subjectId: createSubjectId,
            teacherId: tId,
            weeklyHours: createWeeklyHours,
            maxHoursPerDay: createMaxHoursPerDay,
          });
        }
      }
      await classSubjectRequirementApi.bulkUpsert(payloads);

      toast.success('Mapping berhasil ditambahkan');
      isCreateMappingOpen = false;

      // Refresh data
      await loadRequirementsForClass(selectedRequirementClassId);
      const refreshReqs = await classSubjectRequirementApi.list({});
      if (refreshReqs.data) allClassRequirements = refreshReqs.data as ClassSubjectRequirement[];
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Gagal membuat mapping';
      toast.error(msg);
    } finally {
      isCreatingMapping = false;
    }
  }

  // Tabel read-only: tampilkan baris yang punya mapping guru (dari requirement ATAU SubjectTeacher).
  let displayedRequirements = $derived(requirements.filter((r) => r.teacherIds.length > 0));

  // Teacher options filtered by selected subject in create mapping modal
  let createTeacherOptions = $derived(
    createSubjectId
      ? [{ value: '', label: '-- Pilih Guru --' }, ...getTeachersForSubject(createSubjectId).map((t) => ({ value: t.id, label: formatTeacherName(t) }))]
      : [{ value: '', label: 'Pilih mapel dulu' }]
  );

  // Load Requirements for Selected Class — group by subject, collect teacherIds
  async function loadRequirementsForClass(classId: string) {
    if (!classId) return;
    try {
      const res = await classSubjectRequirementApi.list({ classId });
      const existing = (res.data as ClassSubjectRequirement[]) || [];

      // Group by subjectId
      const grouped = new Map<string, { rows: ClassSubjectRequirement[]; sub: ShadowSubject }>();
      for (const rec of existing) {
        const sub = allSubjects.find((s) => s.id === rec.subjectId);
        if (!sub) continue;
        if (!grouped.has(sub.id)) grouped.set(sub.id, { rows: [], sub });
        grouped.get(sub.id)!.rows.push(rec);
      }

      // Hanya tampilkan subjek yang BENAR-BENAR memiliki data ClassSubjectRequirement tersimpan
      // untuk kelas ini (tanpa sintesis/fallback dari mapping SubjectTeacher).
      const eligibleSubjects = allSubjects.filter((sub) => grouped.has(sub.id));
      const merged: SubjectRequirementRow[] = eligibleSubjects.map((sub) => {
        const g = grouped.get(sub.id);
        const reqTeacherIds = g ? g.rows.map((r) => r.teacherId).filter((t): t is string => t !== null && t !== undefined) : [];
        // Guru diambil hanya dari requirement tersimpan (tidak fallback ke SubjectTeacher).
        const teacherIds: string[] = [...new Set(reqTeacherIds)];
        const existingIds = g ? g.rows.map((r) => r.id).filter(Boolean) as string[] : [];
        const weeklyHours = g ? (g.rows[0]?.weeklyHours ?? 2) : 2;
        const maxHoursPerDay = g ? Math.min(...g.rows.map((r) => r.maxHoursPerDay || 2)) : 2;
        return {
          subjectId: sub.id,
          subjectName: sub.name,
          subjectCode: sub.code || '',
          teacherIds,
          existingIds,
          weeklyHours,
          maxHoursPerDay,
        };
      });
      requirements = merged;
    } catch {
      toast.error('Gagal memuat kebutuhan jam kelas');
    }
  }

  // Bulk delete selected requirements
  function toggleReqSelect(ids: string[]) {
    const allSelected = ids.every((id) => selectedReqIds.includes(id));
    if (allSelected) {
      selectedReqIds = selectedReqIds.filter((i) => !ids.includes(i));
    } else {
      selectedReqIds = [...selectedReqIds, ...ids.filter((id) => !selectedReqIds.includes(id))];
    }
  }

  function selectAllReqs() {
    const savedIds = allClassRequirements.map((r) => r.id).filter((id): id is string => Boolean(id));
    if (selectedReqIds.length === savedIds.length && savedIds.length > 0) {
      selectedReqIds = [];
    } else {
      selectedReqIds = [...savedIds];
    }
  }

  async function handleBulkDeleteReqs() {
    if (selectedReqIds.length === 0) return;
    try {
      await classSubjectRequirementApi.bulkDelete(selectedReqIds);
      toast.success(`${selectedReqIds.length} data alokasi berhasil dihapus`);
      isBulkDeleteReqOpen = false;
      selectedReqIds = [];
      // Refresh data
      const refreshReqs = await classSubjectRequirementApi.list({});
      if (refreshReqs.data) allClassRequirements = refreshReqs.data as ClassSubjectRequirement[];
      if (selectedRequirementClassId) await loadRequirementsForClass(selectedRequirementClassId);
    } catch {
      toast.error('Gagal menghapus data alokasi');
    }
  }

  async function handleClearAllReqs() {
    try {
      const reqIds = requirements.flatMap((r) => r.existingIds);
      if (reqIds.length === 0) {
        toast.error('Tidak ada data untuk kelas ini');
        return;
      }
      await classSubjectRequirementApi.bulkDelete(reqIds);
      const className = allClasses.find((c) => c.id === selectedRequirementClassId)?.name || '';
      toast.success(`Semua data alokasi jam pelajaran untuk kelas ${className} berhasil dihapus`);
      isClearAllReqOpen = false;
      selectedReqIds = [];
      const refreshReqs = await classSubjectRequirementApi.list({});
      if (refreshReqs.data) allClassRequirements = refreshReqs.data as ClassSubjectRequirement[];
      if (selectedRequirementClassId) await loadRequirementsForClass(selectedRequirementClassId);
    } catch {
      toast.error('Gagal menghapus semua data alokasi');
    }
  }

  // Load Teacher Unavailabilities
  async function loadTeacherUnavailabilities(teacherId: string) {
    if (!teacherId) return;
    try {
      const res = await teacherUnavailabilityApi.list(teacherId);
      const list = (res.data as TeacherUnavailability[]) || [];
      teacherUnavailabilities = list;
      const keys = new Set<string>();
      for (const item of list) {
        keys.add(`${item.day}_${item.lessonHourId}`);
      }
      blockedSlotKeys = keys;
    } catch {
      toast.error('Gagal memuat halangan guru');
    }
  }

  function toggleBlockedSlot(day: string, hourId: string) {
    const key = `${day}_${hourId}`;
    const next = new Set(blockedSlotKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    blockedSlotKeys = next;
  }

  async function saveTeacherUnavailability() {
    if (!selectedTeacherId) return;
    try {
      isSavingUnavailability = true;
      const payload = Array.from(blockedSlotKeys).map((key) => {
        const [day, lessonHourId] = key.split('_');
        return { day: day!, lessonHourId: lessonHourId! };
      });
      await teacherUnavailabilityApi.bulkSet(selectedTeacherId, payload);
      toast.success('Halangan mengajar guru berhasil disimpan!');
    } catch {
      toast.error('Gagal menyimpan halangan guru');
    } finally {
      isSavingUnavailability = false;
    }
  }

  // Bulk delete selected unavailabilities
  function toggleUnavailHourSelect(hourId: string) {
    if (selectedUnavailHourIds.includes(hourId)) {
      selectedUnavailHourIds = selectedUnavailHourIds.filter((id) => id !== hourId);
    } else {
      selectedUnavailHourIds = [...selectedUnavailHourIds, hourId];
    }
  }

  function selectAllUnavailHours() {
    const blockableHourIds = sortedLessonHours
      .filter((h) => Array.from(blockedSlotKeys).some((k) => k.endsWith(`_${h.id}`)))
      .map((h) => h.id);
    if (selectedUnavailHourIds.length === blockableHourIds.length && blockableHourIds.length > 0) {
      selectedUnavailHourIds = [];
    } else {
      selectedUnavailHourIds = [...blockableHourIds];
    }
  }

  async function handleBulkDeleteUnavail() {
    if (selectedUnavailHourIds.length === 0) return;
    try {
      const unavailIds = teacherUnavailabilities
        .filter((u) => selectedUnavailHourIds.includes(u.lessonHourId))
        .map((u) => u.id)
        .filter((id): id is string => id !== undefined);
      if (unavailIds.length === 0) {
        toast.error('Tidak ada halangan yang dapat dihapus');
        return;
      }
      await teacherUnavailabilityApi.bulkDelete(unavailIds);
      toast.success(`${unavailIds.length} halangan guru berhasil dihapus`);
      isBulkDeleteUnavailOpen = false;
      selectedUnavailHourIds = [];
      await loadTeacherUnavailabilities(selectedTeacherId);
    } catch {
      toast.error('Gagal menghapus halangan guru');
    }
  }

  // Run Generator
  async function runGenerator() {
    if (checkOverAllocatedTeachers()) return; // Stop if over-allocated

    try {
      isGenerating = true;
      generateElapsed = 0;
      generateTimer = setInterval(() => generateElapsed++, 1000);
      const result = await timetableGeneratorApi.preview({
        workingDays: selectedWorkingDays,
        timeoutMs,
        enableBatchTeaching,
      });

      const data = result.data;
      if (!data) {
        toast.error('Generator tidak menghasilkan data. Pastikan matriks Beban Jam (Tab 1) sudah terisi.');
        return;
      }

      // Fallback: Redis tidak tersedia → hasil langsung dikembalikan (engine
      // berjalan di worker thread di sisi API).
      if (data.mode === 'inline') {
        previewResult = data.result;
        activeTab = 'preview';
        toast.success(`Generator selesai! Kualitas jadwal: ${previewResult.qualityScore}%`);
        return;
      }

      // Jalur utama: job diproses di background (BullMQ). Polling status.
      const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const deadline = Date.now() + (timeoutMs ?? 15000) + 30000;
      while (Date.now() < deadline) {
        await sleep(1500);

        let statusRes: Awaited<ReturnType<typeof timetableGeneratorApi.previewStatus>>;
        try {
          statusRes = await timetableGeneratorApi.previewStatus(data.jobId);
        } catch {
          toast.error('Layanan antrian tidak tersedia. Silakan coba lagi.');
          return;
        }

        const status = statusRes.data;
        if (!status) {
          toast.error('Gagal membaca status job preview.');
          return;
        }

        if (status.status === 'completed' && status.result) {
          previewResult = status.result;
          activeTab = 'preview';
          toast.success(`Generator selesai! Kualitas jadwal: ${previewResult.qualityScore}%`);
          return;
        }
        if (status.status === 'failed') {
          toast.error(`Generator gagal: ${status.error}`);
          return;
        }
        if (status.status === 'not_found') {
          toast.error('Job preview tidak ditemukan. Silakan coba lagi.');
          return;
        }
        if (status.status === 'unavailable') {
          toast.error('Layanan antrian tidak tersedia. Silakan coba lagi.');
          return;
        }
      }

      toast.error('Waktu proses generator habis. Silakan coba lagi.');
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : String(e || 'Gagal menjalankan generator jadwal');
      toast.error(msg);
      if (/Kebutuhan Jam/i.test(msg) || /ClassSubjectRequirement/i.test(msg)) {
        activeTab = 'requirements';
      }
    } finally {
      isGenerating = false;
      if (generateTimer) {
        clearInterval(generateTimer);
        generateTimer = null;
      }
    }
  }

  // Commit Schedule to DB
  async function publishSchedule() {
    if (!previewResult || previewResult.schedules.length === 0) return;
    try {
      isPublishing = true;
      await timetableGeneratorApi.commit({
        clearExisting: true,
        schedules: previewResult.schedules,
      });
      toast.success('Jadwal pelajaran berhasil dipublikasikan ke database!');
      isPublishModalOpen = false;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : String(e || 'Gagal mempublikasikan jadwal pelajaran');
      toast.error(msg);
    } finally {
      isPublishing = false;
    }
  }
</script>

<svelte:head>
  <title>Generator Jadwal Pelajaran - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-6 font-data-mono text-data-mono min-w-0 max-w-full">
  <!-- Top Header with Neobrutalism styling -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <PageHeader
      title="Generator Jadwal Pelajaran"
      description="CSP BACKTRACKING TIMETABLE GENERATOR (MRV + FORWARD CHECKING)"
    />
    <div class="flex items-center gap-2">
      <TooltipIconButton
        icon="arrow_left"
        tooltip="Kembali ke Jadwal Pelajaran"
        href="/lesson-schedule"
      />
    </div>
  </div>

  <!-- Wizard Navigation Tabs (Neobrutalism style) -->
  <div class="neo-border bg-surface p-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
    <button
      onclick={() => (activeTab = 'requirements')}
      class="p-3 text-left font-label-caps text-label-caps uppercase neo-border transition-all flex items-center gap-2.5 {activeTab === 'requirements'
        ? 'bg-primary text-on-primary neo-shadow-sm font-bold'
        : 'bg-surface hover:bg-surface-container text-on-surface'}"
    >
      <span class="w-6 h-6 neo-border bg-surface text-on-surface text-xs flex items-center justify-center font-bold">1</span>
      <span>Beban Jam (Requirements)</span>
    </button>

    <button
      onclick={() => (activeTab = 'unavailability')}
      class="p-3 text-left font-label-caps text-label-caps uppercase neo-border transition-all flex items-center gap-2.5 {activeTab === 'unavailability'
        ? 'bg-primary text-on-primary neo-shadow-sm font-bold'
        : 'bg-surface hover:bg-surface-container text-on-surface'}"
    >
      <span class="w-6 h-6 neo-border bg-surface text-on-surface text-xs flex items-center justify-center font-bold">2</span>
      <span>Halangan Guru</span>
    </button>

    <button
      onclick={() => (activeTab = 'run')}
      class="p-3 text-left font-label-caps text-label-caps uppercase neo-border transition-all flex items-center gap-2.5 {activeTab === 'run'
        ? 'bg-primary text-on-primary neo-shadow-sm font-bold'
        : 'bg-surface hover:bg-surface-container text-on-surface'}"
    >
      <span class="w-6 h-6 neo-border bg-surface text-on-surface text-xs flex items-center justify-center font-bold">3</span>
      <span>Eksekusi Generator</span>
    </button>

    <button
      onclick={() => (activeTab = 'preview')}
      class="p-3 text-left font-label-caps text-label-caps uppercase neo-border transition-all flex items-center justify-between gap-2 {activeTab === 'preview'
        ? 'bg-primary text-on-primary neo-shadow-sm font-bold'
        : 'bg-surface hover:bg-surface-container text-on-surface'}"
    >
      <div class="flex items-center gap-2.5">
        <span class="w-6 h-6 neo-border bg-surface text-on-surface text-xs flex items-center justify-center font-bold">4</span>
        <span>Grid Preview</span>
      </div>
      {#if previewResult}
        <span class="px-2 py-0.5 text-xs font-bold neo-border bg-tertiary-fixed text-on-tertiary-fixed">
          {previewResult.qualityScore}%
        </span>
      {/if}
    </button>
  </div>

  {#if isLoadingMaster}
    <div class="neo-border bg-surface p-12 text-center font-data-mono text-data-mono">
      Memuat data master...
    </div>
  {:else}
    <!-- TAB 1: REQUIREMENTS MATRIX -->
    {#if activeTab === 'requirements'}
      <div class="neo-border bg-surface p-6 flex flex-col gap-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 neo-border-b pb-4">
          <div>
            <h2 class="font-headline-md text-headline-md font-bold text-on-surface uppercase">
              Matriks Alokasi Jam Pelajaran
            </h2>
            <p class="text-xs text-on-surface-variant font-data-mono uppercase">
              Data beban jam per kelas (read-only). Tambah mapping baru lewat form &quot;Buat Mapping Baru&quot;.
            </p>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="w-64">
              <SearchableSelect
                id="req-class-select"
                label="Pilih Kelas"
                bind:value={selectedRequirementClassId}
                options={allClasses.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Pilih Kelas"
              />
            </div>
            <div class="mt-5 flex items-center gap-2">
                <TooltipIconButton
                  icon="checklist"
                  tooltip={selectedReqIds.length > 0 ? 'Batal Pilih Semua' : 'Pilih Semua Data'}
                  onclick={selectAllReqs}
                />
                <TooltipIconButton
                  icon="add"
                  tooltip="Buat Mapping Baru"
                  onclick={openCreateMapping}
                  variant="primary"
                />
              {#if selectedReqIds.length > 0}
                <TooltipIconButton
                  icon="delete"
                  tooltip={`Hapus Terpilih (${selectedReqIds.length})`}
                  onclick={() => { if (selectedReqIds.length === 0) { toast.error('Pilih data terlebih dahulu'); return; } isBulkDeleteReqOpen = true; }}
                  variant="danger"
                  badgeCount={selectedReqIds.length}
                />
                <TooltipIconButton
                  icon="delete_sweep"
                  tooltip={`Hapus Semua Alokasi Kelas ${allClasses.find(c => c.id === selectedRequirementClassId)?.name || ''}`}
                  onclick={() => (isClearAllReqOpen = true)}
                  variant="danger"
                />
              {/if}
            </div>
          </div>
        </div>

        <div class="neo-border overflow-x-auto bg-surface">
          <table class="w-full text-left font-data-mono text-data-mono border-collapse">
            <thead>
              <tr class="neo-border-b bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase">
                <th class="p-3 border-r-2 border-on-surface w-10">
                  <Checkbox checked={selectedReqIds.length > 0 && selectedReqIds.length === allClassRequirements.filter(r => Boolean(r.id)).length} onchange={selectAllReqs} />
                </th>
                <th class="p-3 border-r-2 border-on-surface">Mata Pelajaran</th>
                <th class="p-3 border-r-2 border-on-surface w-36">Jam / Minggu</th>
                <th class="p-3 border-r-2 border-on-surface w-36">Max JP / Hari</th>
                <th class="p-3">Guru Pengampu</th>
              </tr>
            </thead>
            <tbody>
              {#if displayedRequirements.length === 0}
                <tr>
                  <td colspan="5" class="p-10 text-center text-on-surface-variant font-data-mono text-data-mono uppercase">
                    Belum ada data alokasi jam pelajaran untuk kelas ini. Gunakan tombol &quot;Buat Mapping Baru&quot; di atas untuk menambahkan data Beban Jam (dengan guru pengampu terpilih).
                  </td>
                </tr>
              {:else}
                {#each displayedRequirements as req}
                  <tr class="neo-border-b hover:bg-surface-container-low">
                    <td class="p-3 border-r-2 border-on-surface text-center">
                      {#if req.existingIds.length > 0}
                        <Checkbox checked={req.existingIds.some((id) => selectedReqIds.includes(id))} onchange={() => toggleReqSelect(req.existingIds)} />
                      {:else}
                        <span class="text-on-surface-variant text-xs">—</span>
                      {/if}
                    </td>
                    <td class="p-3 border-r-2 border-on-surface font-bold text-on-surface">
                      {req.subjectName}
                      <span class="text-xs text-on-surface-variant block font-normal">{req.subjectCode}</span>
                    </td>
                    <td class="p-3 border-r-2 border-on-surface text-center font-bold">
                      {req.weeklyHours} <span class="text-xs font-normal text-on-surface-variant">JP</span>
                    </td>
                    <td class="p-3 border-r-2 border-on-surface text-center font-bold">
                      {req.maxHoursPerDay} <span class="text-xs font-normal text-on-surface-variant">JP</span>
                    </td>
                    <td class="p-3">
                      {#if req.teacherIds.length > 0}
                        <div class="flex flex-wrap gap-1.5">
                          {#each req.teacherIds as tId}
                            {@const teacher = allTeachers.find((t) => t.id === tId)}
                            {#if teacher}
                              <span class="px-2 py-0.5 border-2 border-on-background bg-secondary-container text-on-secondary-container text-xs font-bold">
                                {formatTeacherName(teacher)}
                              </span>
                            {/if}
                          {/each}
                        </div>
                      {:else}
                        <span class="text-on-surface-variant text-xs">—</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- TAB 2: TEACHER UNAVAILABILITY -->
    {#if activeTab === 'unavailability'}
      <div class="neo-border bg-surface p-6 flex flex-col gap-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 neo-border-b pb-4">
          <div>
            <h2 class="font-headline-md text-headline-md font-bold text-on-surface uppercase">
              Ketersediaan & Halangan Mengajar Guru
            </h2>
            <p class="text-xs text-on-surface-variant font-data-mono uppercase">
              Klik pada slot jam/hari untuk menandai waktu libur/halangan mengajar guru (Merah = Halangan).
            </p>
          </div>
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <div class="w-64">
              <SearchableSelect
                id="teacher-unavail-select"
                label="Pilih Guru"
                bind:value={selectedTeacherId}
                options={allTeachers.map((t) => ({ value: t.id, label: formatTeacherName(t) }))}
                placeholder="Pilih Guru"
              />
            </div>
            <div class="mt-5 flex items-center gap-2">
              <TooltipIconButton
                icon="save"
                tooltip={isSavingUnavailability ? 'Menyimpankan...' : 'Simpan Halangan Guru'}
                onclick={saveTeacherUnavailability}
                variant="primary"
              />
              <TooltipIconButton
                icon={selectedUnavailHourIds.length > 0 && selectedUnavailHourIds.length === sortedLessonHours.filter(h => Array.from(blockedSlotKeys).some(k => k.endsWith(`_${h.id}`))).length && sortedLessonHours.some(h => Array.from(blockedSlotKeys).some(k => k.endsWith(`_${h.id}`))) ? 'deselect' : 'checklist'}
                tooltip={selectedUnavailHourIds.length > 0 ? 'Batal Pilih Semua' : 'Pilih Semua Halangan'}
                onclick={selectAllUnavailHours}
              />
              {#if selectedUnavailHourIds.length > 0}
                <TooltipIconButton
                  icon="delete"
                  tooltip={`Hapus Halangan Terpilih (${selectedUnavailHourIds.length})`}
                  onclick={() => { if (selectedUnavailHourIds.length === 0) { toast.error('Pilih data terlebih dahulu'); return; } isBulkDeleteUnavailOpen = true; }}
                  variant="danger"
                  badgeCount={selectedUnavailHourIds.length}
                />
              {/if}
            </div>
          </div>
        </div>

        <div class="neo-border overflow-x-auto bg-surface">
          <table class="w-full text-center font-data-mono text-data-mono border-collapse">
            <thead>
              <tr class="neo-border-b bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps uppercase">
                <th class="p-3 border-r-2 border-on-surface w-10">
                  <Checkbox checked={selectedUnavailHourIds.length > 0 && selectedUnavailHourIds.length === sortedLessonHours.filter(h => Array.from(blockedSlotKeys).some(k => k.endsWith(`_${h.id}`))).length} onchange={selectAllUnavailHours} />
                </th>
                <th class="p-3 border-r-2 border-on-surface w-32">Jam ke-</th>
                {#each days as day}
                  <th class="p-3 border-r-2 border-on-surface last:border-r-0">{day}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each sortedLessonHours as hour}
                <tr class="neo-border-b">
                  <td class="p-2 border-r-2 border-on-surface text-center">
                    {#if Array.from(blockedSlotKeys).some(k => k.endsWith(`_${hour.id}`))}
                      <Checkbox checked={selectedUnavailHourIds.includes(hour.id)} onchange={() => toggleUnavailHourSelect(hour.id)} />
                    {:else}
                      <span class="text-on-surface-variant text-xs">—</span>
                    {/if}
                  </td>
                  <td class="p-2 border-r-2 border-on-surface font-bold bg-surface-container-low text-on-surface">
                    {hour.name}
                    <span class="block text-[10px] text-on-surface-variant font-normal">{hour.startTime}-{hour.endTime}</span>
                  </td>
                  {#each days as day}
                    {@const isBlocked = blockedSlotKeys.has(`${day}_${hour.id}`)}
                    <td class="p-1 border-r-2 border-on-surface last:border-r-0">
                      <button
                        type="button"
                        onclick={() => toggleBlockedSlot(day, hour.id)}
                        class="w-full py-2.5 px-2 neo-border font-label-caps text-label-caps uppercase transition-all {isBlocked
                          ? 'bg-error text-on-error neo-shadow-xs font-bold'
                          : 'bg-surface hover:bg-surface-container-high text-on-surface'}"
                      >
                        {isBlocked ? 'HALANGAN' : 'TERSEDIA'}
                      </button>
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- TAB 3: RUN GENERATOR -->
    {#if activeTab === 'run'}
      <div class="neo-border bg-surface p-8 max-w-2xl mx-auto flex flex-col gap-6 neo-shadow">
        <div>
          <h2 class="font-headline-md text-headline-md font-bold text-on-surface uppercase">
            Eksekusi Generator Jadwal
          </h2>
          <p class="text-xs text-on-surface-variant font-data-mono uppercase mt-1">
            Engine akan memproses alokasi jam & batasan dengan algoritma CSP Backtracking.
          </p>
        </div>

        <div class="flex flex-col gap-4">
          <div>
            <span class="block text-xs font-label-caps text-label-caps uppercase text-on-surface mb-2">
              Hari Kerja Mengajar:
            </span>
            <div class="flex flex-wrap gap-2">
              {#each ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as d}
                <button
                  type="button"
                  onclick={() => {
                    if (selectedWorkingDays.includes(d)) {
                      selectedWorkingDays = selectedWorkingDays.filter((x) => x !== d);
                    } else {
                      selectedWorkingDays = [...selectedWorkingDays, d];
                    }
                  }}
                  class="px-4 py-2 neo-border font-label-caps text-label-caps uppercase transition-all {selectedWorkingDays.includes(d)
                    ? 'bg-primary text-on-primary neo-shadow-xs font-bold'
                    : 'bg-surface text-on-surface hover:bg-surface-container'}"
                >
                  {d}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <label for="timeoutInput" class="block text-xs font-label-caps text-label-caps uppercase text-on-surface mb-1">
              Max Timeout Engine (ms):
            </label>
            <input
              id="timeoutInput"
              type="number"
              bind:value={timeoutMs}
              min="5000"
              max="60000"
              step="1000"
              class="w-full h-11 px-4 neo-border bg-surface text-on-surface font-data-mono font-bold"
            />
            <span class="text-[10px] text-on-surface-variant uppercase mt-1 block">Default: 15000 ms (15 detik)</span>
          </div>

          <div class="flex items-center gap-3">
            <Checkbox
              checked={enableBatchTeaching}
              onchange={() => (enableBatchTeaching = !enableBatchTeaching)}
              class="shrink-0"
            />
            <div>
              <span class="font-label-caps text-label-caps uppercase text-on-surface">Batch Teaching</span>
              <p class="text-[10px] text-on-surface-variant">Gabung kelas dengan guru + mapel sama ke satu slot</p>
            </div>
          </div>
        </div>

        <div class="pt-4 neo-border-t">
          <Button
            variant="primary"
            onclick={runGenerator}
            disabled={isGenerating}
            class="w-full py-4 inline-flex items-center justify-center gap-3 text-base"
          >
            {#if isGenerating}
              <div class="animate-spin rounded-full h-5 w-5 border-2 border-on-primary border-t-transparent shrink-0"></div>
              <span>MEMPROSES JADWAL DI BACKGROUND... ({generateElapsed}s)</span>
            {:else}
              <Icon name="play" class="shrink-0" />
              <span>JALANKAN ENGINE GENERATOR JADWAL</span>
            {/if}
          </Button>
          {#if isGenerating}
            <p class="text-[10px] text-on-surface-variant uppercase mt-2 text-center">
              Proses berjalan di background — biarkan halaman ini terbuka; hasil akan muncul otomatis.
            </p>
          {/if}
        </div>
      </div>
    {/if}

    <!-- TAB 4: PREVIEW GRID & PUBLISH -->
    {#if activeTab === 'preview'}
      {#if !previewResult}
        <div class="neo-border bg-surface p-12 text-center flex flex-col items-center gap-4">
          <Icon name="calendar_month" size="48px" />
          <h3 class="font-headline-md text-headline-md font-bold text-on-surface uppercase">
            Belum Ada Preview Hasil Generator
          </h3>
          <p class="text-xs text-on-surface-variant font-data-mono uppercase">
            Silakan jalankan engine di Tab 3 terlebih dahulu.
          </p>
          <Button variant="primary" onclick={() => (activeTab = 'run')}>
            KE TAB 3 (EKSEKUSI ENGINE)
          </Button>
        </div>
      {:else}
        <!-- Stats Summary Banner -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 font-data-mono text-data-mono">
          <div class="neo-border bg-surface p-4 neo-shadow-sm">
            <span class="text-xs font-label-caps uppercase text-on-surface-variant">Skor Kualitas Jadwal</span>
            <div class="text-3xl font-black text-on-surface mt-1">{previewResult.qualityScore}%</div>
            <span class="text-[10px] text-on-surface-variant uppercase block mt-1">0 Hard Conflict</span>
          </div>

          <div class="neo-border bg-surface p-4 neo-shadow-sm">
            <span class="text-xs font-label-caps uppercase text-on-surface-variant">Beban Jam Teralokasi</span>
            <div class="text-3xl font-bold text-on-surface mt-1">
              {previewResult.stats.assignedHours} / {previewResult.stats.totalHours} <span class="text-xs font-normal text-on-surface-variant">JP</span>
            </div>
          </div>

          <div class="neo-border bg-surface p-4 neo-shadow-sm">
            <span class="text-xs font-label-caps uppercase text-on-surface-variant">Langkah Iterasi (Attempts)</span>
            <div class="text-3xl font-bold text-on-surface mt-1">{previewResult.stats.attempts.toLocaleString()}</div>
          </div>

          <div class="neo-border bg-surface p-4 neo-shadow-sm">
            <span class="text-xs font-label-caps uppercase text-on-surface-variant">Waktu Eksekusi</span>
            <div class="text-3xl font-bold text-on-surface mt-1">{previewResult.stats.durationMs} <span class="text-xs font-normal text-on-surface-variant">ms</span></div>
          </div>
        </div>

        <!-- Unassigned Warning if any -->
        {#if previewResult.unassigned.length > 0}
          <div class="neo-border bg-warning-container text-on-warning-container p-4 flex flex-col gap-2 font-data-mono text-data-mono">
            <div class="flex items-center gap-2 font-bold text-sm uppercase">
              <Icon name="warning" />
              <span>Ada {previewResult.unassigned.length} Pelajaran Yang Belum Teralokasi (Partial Schedule)</span>
            </div>
            <ul class="text-xs space-y-1 list-disc list-inside uppercase">
              {#each previewResult.unassigned as item}
                <li>
                  Kelas <span class="font-bold">{item.classNames.join(', ')}</span> - {item.subjectName} ({item.teacherNames.join(', ')}) [{item.duration} JP]: {item.reason}
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Grid View Controls -->
        <div class="neo-border bg-surface p-6 flex flex-col gap-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 neo-border-b pb-4">
            <div class="flex flex-wrap items-center gap-3">
              <span class="text-xs font-label-caps uppercase text-on-surface">Tampilkan Grid:</span>
              <div class="w-44">
                <SearchableSelect
                  id="preview-mode-select"
                  label=""
                  bind:value={previewMode}
                  options={[
                    { value: 'class', label: 'Per Kelas' },
                    { value: 'teacher', label: 'Per Guru' },
                  ]}
                  placeholder="Pilih Mode"
                />
              </div>

              {#if previewMode === 'class'}
                <div class="w-48">
                  <SearchableSelect
                    id="preview-class-select"
                    label=""
                    bind:value={selectedPreviewClassId}
                    options={allClasses.map((c) => ({ value: c.id, label: c.name }))}
                    placeholder="Pilih Kelas"
                  />
                </div>
              {:else}
                <div class="w-64">
                  <SearchableSelect
                    id="preview-teacher-select"
                    label=""
                    bind:value={selectedPreviewTeacherId}
                    options={allTeachers.map((t) => ({ value: t.id, label: formatTeacherName(t) }))}
                    placeholder="Pilih Guru"
                  />
                </div>
              {/if}
            </div>

            <TooltipIconButton
              icon="check_circle"
              tooltip="Publikasikan Jadwal ke Database"
              onclick={() => (isPublishModalOpen = true)}
              variant="primary"
            />
          </div>

          <!-- Timetable Grid Table (Shared DRY Component) -->
          <TimetableGridTable
            hours={sortedLessonHours}
            days={days as unknown as string[]}
            slots={previewGridSlots}
          />
        </div>
      {/if}
    {/if}
  {/if}
</div>

<!-- Modal Confirmation Publish Schedule -->
<Modal bind:isOpen={isPublishModalOpen} title="Publikasikan Jadwal Pelajaran">
  <div class="flex flex-col gap-4 font-data-mono text-data-mono">
    <p class="text-sm text-on-surface">
      Apakah Anda yakin ingin mempublikasikan draf hasil jadwal ini? Jadwal pelajaran yang aktif saat ini di database akan diperbarui.
    </p>

    <div class="neo-border p-4 bg-surface-container-low text-xs text-on-surface space-y-1">
      <div>Total slot jadwal: <span class="font-bold">{previewResult?.schedules.length || 0}</span></div>
      <div>Skor kelayakan: <span class="font-bold text-emerald-600">{previewResult?.qualityScore || 0}%</span></div>
    </div>

    <div class="flex justify-end gap-3 pt-4 neo-border-t">
      <Button variant="ghost" onclick={() => (isPublishModalOpen = false)}>BATAL</Button>
      <Button variant="primary" onclick={publishSchedule} disabled={isPublishing}>
        {isPublishing ? 'MEMPUBLIKASIKAN...' : 'YA, PUBLIKASIKAN JADWAL'}
      </Button>
    </div>
  </div>
</Modal>

<!-- Modal Bulk Delete Requirements -->
<Modal bind:isOpen={isBulkDeleteReqOpen} title="Konfirmasi Hapus Massal Alokasi">
  <p class="font-body-md text-body-md">
    Yakin ingin menghapus <strong>{selectedReqIds.length}</strong> data alokasi jam pelajaran yang terpilih?
  </p>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (isBulkDeleteReqOpen = false)}>Batal</Button>
    <Button variant="primary" onclick={handleBulkDeleteReqs}>Hapus Terpilih</Button>
  {/snippet}
</Modal>

<!-- Modal Bulk Delete Unavailability -->
<Modal bind:isOpen={isBulkDeleteUnavailOpen} title="Konfirmasi Hapus Massal Halangan Guru">
  <p class="font-body-md text-body-md">
    Yakin ingin menghapus halangan mengajar guru untuk <strong>{selectedUnavailHourIds.length}</strong> jam pelajaran yang terpilih?
  </p>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (isBulkDeleteUnavailOpen = false)}>Batal</Button>
    <Button variant="primary" onclick={handleBulkDeleteUnavail}>Hapus Terpilih</Button>
  {/snippet}
</Modal>

<!-- Modal Clear All Requirements for Current Class -->
<Modal bind:isOpen={isClearAllReqOpen} title="Konfirmasi Hapus Semua Alokasi Kelas">
  <div class="flex flex-col gap-3">
    <p class="font-body-md text-body-md">
      Yakin ingin menghapus <strong>SEMUA</strong> data alokasi jam pelajaran untuk kelas <strong>{allClasses.find(c => c.id === selectedRequirementClassId)?.name || ''}</strong>?
    </p>
    <div class="neo-border p-3 bg-error-container text-error text-xs font-data-mono">
      <Icon name="warning" size="16px" class="inline mr-1" />Tindakan ini akan menghapus semua data matriks beban jam untuk kelas ini. Data yang dihapus bersifat soft-delete dan dapat dipulihkan dari database.
    </div>
  </div>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (isClearAllReqOpen = false)}>Batal</Button>
    <Button variant="primary" onclick={handleClearAllReqs}>Ya, Hapus Semua</Button>
  {/snippet}
</Modal>

<!-- Modal Create Mapping -->
<Modal bind:isOpen={isCreateMappingOpen} title="Buat Mapping Baru">
  <div class="flex flex-col gap-4 overflow-y-auto max-h-[55vh] pr-1">
    <SearchableSelect
      id="create-map-class"
      label="Kelas (Bisa Pilih Banyak untuk Batch Teaching)"
      bind:value={createClassIds}
      options={allClasses.map((c) => ({ value: c.id, label: c.name }))}
      placeholder="Pilih Kelas"
      multiple={true}
    />
    <SearchableSelect
      id="create-map-subject"
      label="Mata Pelajaran"
      bind:value={createSubjectId}
      options={allSubjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
      placeholder="Pilih Mapel"
    />
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="create-map-hours" class="font-label-caps text-label-caps uppercase text-on-surface-variant">Jam / Minggu</label>
        <input
          id="create-map-hours"
          type="number"
          min="1"
          bind:value={createWeeklyHours}
          class="w-full h-11 px-3 neo-border bg-surface text-on-surface font-data-mono font-bold text-center mt-1"
        />
      </div>
      <div>
        <label for="create-map-max" class="font-label-caps text-label-caps uppercase text-on-surface-variant">Max JP / Hari</label>
        <input
          id="create-map-max"
          type="number"
          min="1"
          bind:value={createMaxHoursPerDay}
          class="w-full h-11 px-3 neo-border bg-surface text-on-surface font-data-mono font-bold text-center mt-1"
        />
      </div>
    </div>
    <SearchableSelect
      id="create-map-teacher"
      label="Guru Pengampu (Bisa Pilih Banyak untuk Team Teaching)"
      bind:value={createTeacherIds}
      options={createTeacherOptions}
      placeholder={createSubjectId ? 'Pilih Guru' : 'Pilih mapel dulu'}
      multiple={true}
    />
  </div>
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (isCreateMappingOpen = false)}>Batal</Button>
    <Button variant="primary" onclick={handleCreateMapping} disabled={isCreatingMapping}>
      {isCreatingMapping ? 'Menyimpan...' : 'Simpan Mapping'}
    </Button>
  {/snippet}
</Modal>
