<script lang="ts">
	import { Button } from '$lib/components/atoms';
	import { PageHeader, SearchableSelect, TimetableGridTable } from '$lib/components/molecules';
	import type { TimetableCellSlot } from '$lib/components/molecules';
	import {
		lessonScheduleApi,
		scheduleEventApi,
		subjectApi,
		teacherApi,
		classApi,
		lessonHourApi
	} from '$lib/services';
	import type {
		LessonSchedule,
		ScheduleEvent,
		ShadowSubject,
		ShadowTeacher,
		ShadowClass,
		LessonHour
	} from '$lib/types';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatTeacherName } from '$lib/utils/image';
	import { expandEventsToSlots } from '$lib/utils/schedule-event';
	import { goto } from '$app/navigation';
	import { WORK_DAYS } from '$lib/constants';

	const days = WORK_DAYS;

	let allSubjects = $state<ShadowSubject[]>([]);
	let allTeachers = $state<ShadowTeacher[]>([]);
	let allClasses = $state<ShadowClass[]>([]);
	let allLessonHours = $state<LessonHour[]>([]);
	let schedules = $state<LessonSchedule[]>([]);
	let allEvents = $state<ScheduleEvent[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	// Filters
	let mode = $state<'kelas' | 'guru'>('kelas');
	let filterClassId = $state('');
	let filterTeacherId = $state('');

	function switchMode(next: 'kelas' | 'guru') {
		mode = next;
		filterClassId = '';
		filterTeacherId = '';
	}

	let filteredSchedules = $derived.by(() => {
		let result = schedules.filter((s) => s.deletedAt === null && s.status === 'Aktif');
		if (mode === 'kelas' && filterClassId)
			result = result.filter((s) => s.classes.some((c) => c.class.id === filterClassId));
		if (mode === 'guru' && filterTeacherId)
			result = result.filter((s) => s.teachers.some((t) => t.teacher.id === filterTeacherId));
		return result;
	});

	let eventGridSlots = $derived.by<TimetableCellSlot[]>(() =>
		expandEventsToSlots(allEvents, allLessonHours)
	);

	let gridSlots = $derived.by<TimetableCellSlot[]>(() => [
		...filteredSchedules.map((s) => ({
			id: s.id,
			subjectName: getSubjectName(s.subjectId),
			day: s.day,
			lessonHourId: s.lessonHourId,
			teachers:
				mode === 'guru'
					? []
					: s.teachers.map((t) => ({ id: t.teacher.id, name: formatTeacherName(t.teacher) })),
			classes:
				mode === 'kelas' ? [] : s.classes.map((c) => ({ id: c.class.id, name: c.class.name })),
			notes: s.notes
		})),
		...eventGridSlots
	]);

	let sortedAllHours = $derived([...allLessonHours].sort((a, b) => a.order - b.order));

	let selectedClassName = $derived(allClasses.find((c) => c.id === filterClassId)?.name ?? '');
	let selectedTeacherName = $derived(
		filterTeacherId ? formatTeacherName(allTeachers.find((t) => t.id === filterTeacherId)) : ''
	);
	let printSubtitle = $derived.by(() => {
		if (mode === 'kelas') {
			return filterClassId ? `Kelas: ${selectedClassName}` : 'Semua Kelas';
		}
		return filterTeacherId ? `Guru: ${selectedTeacherName}` : 'Semua Guru';
	});

	function getSubjectName(id: string): string {
		return allSubjects.find((s) => s.id === id)?.name ?? id;
	}

	async function loadData() {
		isLoading = true;
		error = '';
		try {
			const [scheduleRes, subjectRes, teacherRes, classRes, lessonHourRes, eventRes] =
				await Promise.all([
					lessonScheduleApi.list(1, 200),
					subjectApi.list(1, 200),
					teacherApi.list(1, 200),
					classApi.list(1, 200),
					lessonHourApi.list(1, 50),
					scheduleEventApi.list(1, 200)
				]);

			if (subjectRes.data) allSubjects = subjectRes.data as ShadowSubject[];
			if (teacherRes.data) allTeachers = teacherRes.data as ShadowTeacher[];
			if (classRes.data) allClasses = classRes.data as ShadowClass[];
			if (lessonHourRes.data) allLessonHours = lessonHourRes.data as LessonHour[];
			if (scheduleRes.data) schedules = scheduleRes.data as LessonSchedule[];
			if (eventRes.data) allEvents = eventRes.data as ScheduleEvent[];
		} catch (e) {
			error = String(e);
			toast.error('Gagal memuat data jadwal');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadData();
		document.body.classList.add('print-schedule');
		return () => document.body.classList.remove('print-schedule');
	});
</script>

<svelte:head>
	<title>Cetak Jadwal Pelajaran - Akademik-BN</title>
	<style>
		/* ——— Tidak ada overflow-x / scrollbar horizontal ——— */
		body.print-schedule table {
			table-layout: fixed;
			width: 100% !important;
		}
		body.print-schedule th,
		body.print-schedule td {
			min-width: 0 !important;
			overflow-wrap: break-word;
		}
		body.print-schedule table span,
		body.print-schedule table p {
			white-space: normal !important;
		}

		@media print {
			body.print-schedule aside,
			body.print-schedule header {
				display: none !important;
			}
			body.print-schedule main {
				margin-left: 0 !important;
				padding: 0 !important;
			}
			.print-hidden {
				display: none !important;
			}
			@page {
				size: A4 portrait;
				margin: 10mm;
			}
			/* Warna latar ikut tercetak */
			body.print-schedule * {
				-webkit-print-color-adjust: exact !important;
				print-color-adjust: exact !important;
			}
			/* Tabel rapi: header berulang & baris tidak terpotong antar halaman */
			body.print-schedule thead {
				display: table-header-group;
			}
			body.print-schedule tr,
			body.print-schedule th,
			body.print-schedule td {
				break-inside: avoid;
				page-break-inside: avoid;
			}
			body.print-schedule th {
				font-size: 9px !important;
				padding: 4px 4px !important;
			}
			body.print-schedule td {
				font-size: 9px !important;
				padding: 3px 3px !important;
			}
			/* Padatkan sel agar muat maksimal 2 lembar A4 */
			body.print-schedule td > div[class*='min-h-'] {
				min-height: 24px !important;
			}
			body.print-schedule td div[class*='neo-border-sm'] {
				padding: 2px 3px !important;
				border-width: 1px !important;
				box-shadow: none !important;
				margin-bottom: 2px !important;
			}
			body.print-schedule td p {
				font-size: 9px !important;
				line-height: 1.15 !important;
			}
			body.print-schedule td span {
				font-size: 8px !important;
				padding: 0 3px !important;
			}
		}
	</style>
</svelte:head>

<div class="flex flex-col gap-6 min-w-0 max-w-full">
	<PageHeader
		title="Cetak Jadwal Pelajaran"
		description="PRINT JADWAL PELAJARAN"
		class="print-hidden"
	/>

	<!-- Mode toggle -->
	<div class="print-hidden neo-border bg-surface p-1 inline-flex gap-1">
		<button
			type="button"
			onclick={() => switchMode('kelas')}
			class="px-4 py-1.5 font-label-caps text-label-caps uppercase font-bold transition-colors {mode ===
			'kelas'
				? 'bg-primary text-on-primary neo-shadow-sm'
				: 'text-on-surface-variant hover:bg-surface-container-highest'}"
		>
			Filter by Kelas
		</button>
		<button
			type="button"
			onclick={() => switchMode('guru')}
			class="px-4 py-1.5 font-label-caps text-label-caps uppercase font-bold transition-colors {mode ===
			'guru'
				? 'bg-primary text-on-primary neo-shadow-sm'
				: 'text-on-surface-variant hover:bg-surface-container-highest'}"
		>
			Filter by Guru
		</button>
	</div>

	<!-- Filters -->
	<div class="print-hidden neo-border bg-surface p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
		{#if mode === 'kelas'}
			<SearchableSelect
				id="print-filter-class"
				label="Filter Kelas"
				bind:value={filterClassId}
				options={[
					{ value: '', label: 'Semua Kelas' },
					...allClasses.map((c) => ({ value: c.id, label: c.name }))
				]}
				placeholder="Semua Kelas"
			/>
		{:else}
			<SearchableSelect
				id="print-filter-teacher"
				label="Filter Guru"
				bind:value={filterTeacherId}
				options={[
					{ value: '', label: 'Semua Guru' },
					...allTeachers.map((t) => ({ value: t.id, label: formatTeacherName(t) }))
				]}
				placeholder="Semua Guru"
			/>
		{/if}
	</div>

	<!-- Toolbar -->
	<div class="print-hidden flex flex-row items-center justify-end gap-2">
		<Button variant="ghost" onclick={() => goto('/lesson-schedule')}>Kembali</Button>
		<Button variant="primary" onclick={() => window.print()}>Cetak / Simpan PDF</Button>
	</div>

	<!-- Print header -->
	<div class="neo-border bg-surface p-4 flex flex-col gap-1">
		<h2 class="font-headline font-black text-lg uppercase">Jadwal Pelajaran</h2>
		<p class="font-data-mono text-xs text-on-surface-variant">{printSubtitle}</p>
	</div>

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
			showEventClassLabel={false}
		/>
	{/if}
</div>
