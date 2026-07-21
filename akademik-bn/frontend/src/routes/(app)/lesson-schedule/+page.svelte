<script lang="ts">
  import { Icon, Button } from '$lib/components/atoms';
  import { PageHeader, Modal, SearchableSelect, TooltipIconButton } from '$lib/components/molecules';
  import { DataTable } from '$lib/components/organisms/table';
  import { lessonScheduleApi, subjectApi, teacherApi, classApi, lessonHourApi } from '$lib/services';
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

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

  let allSubjects = $state<ShadowSubject[]>([]);
  let allTeachers = $state<ShadowTeacher[]>([]);
  let allClasses = $state<ShadowClass[]>([]);
  let allLessonHours = $state<LessonHour[]>([]);
  let schedules = $state<LessonSchedule[]>([]);
  let isLoading = $state(true);
  let error = $state('');

  // Subject-teacher mapping for teacher filtering
  let subjectTeachers = $state<SubjectTeacher[]>([]);
  let subjectTeachersLoaded = $state(false);

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
    if (filterClassId) result = result.filter((s) => s.classes.some((c) => c.class.id === filterClassId));
    if (filterTeacherId) result = result.filter((s) => s.teachers.some((t) => t.teacher.id === filterTeacherId));
    return result;
  });

  let schedulesByDay = $derived.by<Map<string, LessonSchedule[]>>(() => {
    const map = new Map<string, LessonSchedule[]>();
    days.forEach((d) => map.set(d, []));
    for (const s of filteredSchedules) {
      if (s.deletedAt !== null) continue;
      const list = map.get(s.day);
      if (list) list.push(s);
    }
    return map;
  });

  let allIds = $derived(filteredSchedules.map((s) => s.id));
  let totalSelected = $derived(selectedIds.length);
  let allSelected = $derived(allIds.length > 0 && totalSelected === allIds.length);

  let sortedAllHours = $derived(
    [...allLessonHours].sort((a, b) => a.order - b.order)
  );

  // Teachers who teach the selected subject (for form)
  let teachersForSubject = $derived.by(() => {
    if (!formSubjectId) return [];
    const teacherIds = subjectTeachers
      .filter((st) => st.subjectId === formSubjectId && st.status === 'Aktif')
      .map((st) => st.teacherId);
    return allTeachers
      .filter((t) => teacherIds.includes(t.id) && t.status === 'Aktif');
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

  async function loadSubjectTeachers() {
    try {
      const res = await teacherApi.subjectTeachers.list(1, 200);
      if (res.data) subjectTeachers = res.data as SubjectTeacher[];
      subjectTeachersLoaded = true;
    } catch {
      subjectTeachersLoaded = true;
    }
  }

  async function loadData() {
    isLoading = true;
    error = '';
    try {
      const [scheduleRes, subjectRes, teacherRes, classRes, lessonHourRes, stRes] = await Promise.all([
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
      subjectTeachersLoaded = true;
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
    if (!formSubjectId) { toast.error('Pilih mata pelajaran'); return; }
    if (formLessonHourIds.length === 0) { toast.error('Pilih minimal 1 jam pelajaran'); return; }
    if (formTeacherIds.length === 0) { toast.error('Pilih minimal 1 guru'); return; }
    if (formClassIds.length === 0) { toast.error('Pilih minimal 1 kelas'); return; }

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
    if (selectedIds.length === 0) { toast.error('Pilih jadwal terlebih dahulu'); return; }
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

<div class="flex flex-col gap-6">
  <PageHeader title="Jadwal Pelajaran" description="MANAJEMEN JADWAL PELAJARAN" />

  <!-- Filters: Kelas & Guru only -->
  <div class="neo-border bg-surface p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
    <SearchableSelect
      id="filter-class"
      label="Filter Kelas"
      bind:value={filterClassId}
      options={[{ value: '', label: 'Semua Kelas' }, ...allClasses.map((c) => ({ value: c.id, label: c.name }))]}
      placeholder="Semua Kelas"
    />
    <SearchableSelect
      id="filter-teacher"
      label="Filter Guru"
      bind:value={filterTeacherId}
      options={[{ value: '', label: 'Semua Guru' }, ...allTeachers.map((t) => ({ value: t.id, label: formatTeacherName(t) }))]}
      placeholder="Semua Guru"
    />
  </div>

  <!-- Toolbar -->
  <div class="flex flex-row items-center justify-end gap-2">
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
    <TooltipIconButton
      icon="add"
      tooltip="Tambah Jadwal"
      onclick={openCreate}
      variant="primary"
    />
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
    <DataTable>
      {#snippet children()}
        <table class="w-full border-collapse font-data-mono text-data-mono">
          <thead>
            <tr class="neo-border-b bg-surface-container">
              <th class="p-3 text-left font-label-caps text-label-caps uppercase text-on-surface-variant border-r-2 border-on-surface min-w-[120px]">
                Jam
              </th>
              {#each days as day}
                <th class="p-3 text-left font-label-caps text-label-caps uppercase text-on-surface-variant border-r-2 border-on-surface last:border-r-0 min-w-[200px]">
                  {day}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each sortedAllHours as lh}
              <tr class="neo-border-b last:border-b-0">
                <td class="p-3 font-bold text-on-surface-variant border-r-2 border-on-surface align-top whitespace-nowrap text-xs leading-tight">
                  {lh.name}<br>
                  <span class="font-data-mono text-xs">{lh.startTime} - {lh.endTime}</span>
                </td>
                {#each days as day}
                  {@const daySchedules = (schedulesByDay.get(day) ?? []).filter(
                    (s) => s.lessonHourId === lh.id
                  )}
                  <td class="p-2 border-r-2 last:border-r-0 align-top">
                    {#if daySchedules.length === 0}
                      <div class="min-h-[60px] flex items-center justify-center">
                        <span class="text-on-surface-variant opacity-30 text-xs">—</span>
                      </div>
                    {:else}
                      {#each daySchedules as sched}
                        <div
                          class="neo-border-sm bg-surface p-2 mb-2 last:mb-0 cursor-pointer transition-shadow hover:shadow-[2px_2px_0px_0px_#1C1B1B] {selectedIds.includes(
                            sched.id
                          )
                            ? 'bg-primary-container border-primary'
                            : ''}"
                          onclick={() => toggleSelect(sched.id)}
                          onkeydown={(e) => e.key === 'Enter' && toggleSelect(sched.id)}
                          role="button"
                          tabindex="0"
                        >
                          <div class="flex items-start gap-2">
                            <button
                              class="w-4 h-4 neo-border-sm flex items-center justify-center shrink-0 mt-0.5 cursor-pointer {selectedIds.includes(
                                sched.id
                              )
                                ? 'bg-primary text-on-primary'
                                : 'bg-white hover:bg-surface-container-higher'}"
                              onclick={(e) => { e.stopPropagation(); toggleSelect(sched.id); }}
                            >
                              {#if selectedIds.includes(sched.id)}
                                <Icon name="check" size="10px" />
                              {/if}
                            </button>
                            <div class="min-w-0 flex-1">
                              <p class="font-bold text-sm leading-tight truncate">{getSubjectName(sched.subjectId)}</p>
                              <!-- Teachers (team teaching) -->
                              <div class="mt-1 flex flex-wrap gap-1">
                                {#each sched.teachers as t}
                                  <span class="bg-secondary-fixed-dim text-xs px-1.5 py-0.5 neo-border-xs whitespace-nowrap flex items-center gap-1">
                                    <Icon name="person" size="10px" />
                                    {formatTeacherName(t.teacher)}
                                  </span>
                                {/each}
                              </div>
                              <!-- Classes (batch teaching) -->
                              <div class="mt-1 flex flex-wrap gap-1">
                                {#each sched.classes as c}
                                  <span class="bg-tertiary-fixed-dim text-xs px-1.5 py-0.5 neo-border-xs whitespace-nowrap flex items-center gap-1">
                                    <Icon name="school" size="10px" />
                                    {c.class.name}
                                  </span>
                                {/each}
                              </div>
                              {#if sched.notes}
                                <p class="text-xs text-on-surface-variant mt-1 italic truncate">📝 {sched.notes}</p>
                              {/if}
                            </div>
                          </div>
                        </div>
                      {/each}
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      {/snippet}
    </DataTable>
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
      <p class="text-xs text-on-surface-variant mb-2">Pilih 1 atau lebih untuk blok jam (bulk create)</p>
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
    <div class="flex flex-col gap-2">
      <label class="font-label-caps text-label-caps uppercase text-on-surface-variant" for="create-notes">Catatan (opsional)</label>
      <input
        id="create-notes"
        type="text"
        bind:value={formNotes}
        placeholder="Misal: Team teaching / Kelas gabungan"
        class="w-full bg-surface-container-lowest neo-border px-4 py-3 font-data-mono text-data-mono text-on-background focus:outline-none focus:shadow-[4px_4px_0px_0px_#1C1B1B] transition-shadow"
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
      <p class="text-xs text-on-surface-variant mb-2">Pilih lebih dari 1 kelas untuk batch teaching (kelas gabungan)</p>
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
    <Button variant="ghost" onclick={() => (isCreateOpen = false)} disabled={isSaving}>Batal</Button>
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
