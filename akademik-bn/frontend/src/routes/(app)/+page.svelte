<script lang="ts">
	import { Icon, Button } from '$lib/components/atoms';
	import { PageHeader, StatCard, TooltipIconButton } from '$lib/components/molecules';
	import { majorApi, classApi, studentApi, teacherApi, subjectApi, academicYearApi } from '$lib/services';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { apiClient } from '$lib/utils/api';
	import type { ShadowAcademicYear } from '$lib/types';

	// Stats
	let totalMajors = $state(0);
	let totalClasses = $state(0);
	let totalStudents = $state(0);
	let totalTeachers = $state(0);
	let totalSubjects = $state(0);
	let totalAcademicYears = $state(0);
	let activeAcademicYearCode = $state('');
	let isStatsLoading = $state(true);

	// Sync
	let isSyncing = $state(false);
	let syncResults = $state<{ module: string; upserted: number; error?: string }[] | null>(null);

	onMount(async () => {
		try {
			const [
				majorsRes, classesRes, studentsRes, teachersRes,
				subjectsRes, academicYearsRes
			] = await Promise.all([
				majorApi.list(1, 1),
				classApi.list(1, 1),
				studentApi.list(1, 1, { status: 'Aktif' }),
				teacherApi.list(1, 1, { status: 'Aktif' }),
				subjectApi.list(1, 1),
				academicYearApi.list(1, 10)
			]);
			totalMajors = majorsRes.pagination?.totalData ?? 0;
			totalClasses = classesRes.pagination?.totalData ?? 0;
			totalStudents = studentsRes.pagination?.totalData ?? 0;
			totalTeachers = teachersRes.pagination?.totalData ?? 0;
			totalSubjects = subjectsRes.pagination?.totalData ?? 0;
			totalAcademicYears = academicYearsRes.pagination?.totalData ?? 0;
			if (academicYearsRes.data) {
				const years = academicYearsRes.data as ShadowAcademicYear[];
				const active = years.find((y) => y.status === 'Aktif');
				activeAcademicYearCode = active ? `${active.code}` : '';
			}
		} catch {
			// silent
		} finally {
			isStatsLoading = false;
		}
	});

	async function handleSyncAll() {
		if (isSyncing) return;
		isSyncing = true;
		syncResults = null;
		try {
			const res = await apiClient('/webhook/sync-all', { method: 'POST' });
			const json = await res.json();
			if (json.data) {
				syncResults = json.data as { module: string; upserted: number; error?: string }[];
			}
			toast.success('Sync-all selesai');
		} catch {
			toast.error('Gagal sync data');
		} finally {
			isSyncing = false;
		}
	}

	const shortcuts = [
		{ label: 'Dashboard', icon: 'dashboard', route: '/', color: 'bg-primary text-on-primary' },
		{ label: 'Jurusan Murid', icon: 'school', route: '/major-students', color: 'bg-secondary text-on-secondary' },
		{ label: 'Kelas Murid', icon: 'groups', route: '/class-students', color: 'bg-tertiary text-on-tertiary' },
		{ label: 'Guru Mapel', icon: 'menu_book', route: '/subject', color: 'bg-primary-container text-on-primary-container' },
		{ label: 'Jadwal Piket', icon: 'calendar_today', route: '/schedule', color: 'bg-secondary-fixed text-on-secondary-fixed' }
	];

	const moduleLabels: Record<string, string> = {
		'academic-years': 'Tahun Ajaran',
		majors: 'Jurusan',
		classes: 'Kelas',
		teachers: 'Guru',
		students: 'Murid',
		subjects: 'Mapel'
	};
</script>

<div class="flex flex-col gap-8">
	<PageHeader title="Dashboard" description="SISTEM INFORMASI AKADEMIK / MODUL PEMETAAN" class="mb-4" />

	<!-- Sync -->
	<div class="flex justify-end">
		<TooltipIconButton
				icon="schedule"
				tooltip={isSyncing ? 'Menyinkronkan...' : 'Sync All Data'}
				onclick={handleSyncAll}
				variant={isSyncing ? 'ghost' : 'primary'}
			/>
	</div>

	<!-- Sync Results -->
	{#if syncResults}
		<div class="neo-border bg-surface-container p-4">
			<h4 class="font-data-mono text-data-mono font-bold mb-3 uppercase">Hasil Sinkronisasi</h4>
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
				{#each syncResults as result}
					<div
						class="neo-border-sm px-3 py-2 flex items-center justify-between {result.error
							? 'bg-error-container'
							: 'bg-surface'}"
					>
						<span class="font-body-md text-body-md font-bold">{moduleLabels[result.module] ?? result.module}</span>
						{#if result.error}
							<span class="font-data-mono text-data-mono text-error" title={result.error}>Gagal</span>
						{:else}
							<span class="font-data-mono text-data-mono text-on-surface-variant">{result.upserted} data</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Stat Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-gutter">
		<StatCard label="Total Jurusan" value={isStatsLoading ? '...' : String(totalMajors)}>
			<Icon name="school" size="28px" class="text-primary" fill={true} />
		</StatCard>
		<StatCard label="Total Kelas" value={isStatsLoading ? '...' : String(totalClasses)}>
			<Icon name="groups" size="28px" class="text-secondary" fill={true} />
		</StatCard>
		<StatCard label="Total Murid" value={isStatsLoading ? '...' : String(totalStudents)}>
			<Icon name="people" size="28px" class="text-primary" fill={true} />
		</StatCard>
		<StatCard label="Total Guru" value={isStatsLoading ? '...' : String(totalTeachers)}>
			<Icon name="badge" size="28px" class="text-secondary" fill={true} />
		</StatCard>
		<StatCard label="Total Mapel" value={isStatsLoading ? '...' : String(totalSubjects)}>
			<Icon name="menu_book" size="28px" class="text-primary" fill={true} />
		</StatCard>
		<StatCard label="Tahun Ajaran" value={isStatsLoading ? '...' : activeAcademicYearCode || String(totalAcademicYears)}>
			<Icon name="calendar_today" size="28px" class="text-secondary" fill={true} />
		</StatCard>
	</div>

	<!-- Shortcut Buttons -->
	<div class="neo-border bg-surface p-6">
		<h3 class="font-label-caps text-label-caps uppercase mb-4 flex items-center gap-2">
			<Icon name="dashboard" size="18px" />
			Tombol Pintas
		</h3>
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
			{#each shortcuts as s}
				<button
					class="neo-border neo-shadow-sm {s.color} px-4 py-5 flex flex-col items-center gap-3 cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
					onclick={() => goto(s.route)}
				>
					<Icon name={s.icon} size="32px" />
					<span class="font-label-caps text-label-caps uppercase tracking-widest">{s.label}</span>
				</button>
			{/each}
		</div>
	</div>
</div>
