<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import { PageHeader, StatCard, TooltipIconButton } from '$lib/components/molecules';
	import {
		majorApi,
		classApi,
		studentApi,
		teacherApi,
		subjectApi,
		academicYearApi
	} from '$lib/services';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
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

	async function fetchStats() {
		isStatsLoading = true;
		try {
			const [majorsRes, classesRes, studentsRes, teachersRes, subjectsRes, academicYearsRes] =
				await Promise.all([
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
	}

	onMount(() => {
		fetchStats();
	});

	const shortcuts = [
		{ label: 'Dashboard', icon: 'dashboard', route: '/', color: 'bg-primary text-on-primary' },
		{
			label: 'Jurusan Murid',
			icon: 'school',
			route: '/major-students',
			color: 'bg-secondary text-on-secondary'
		},
		{
			label: 'Kelas Murid',
			icon: 'groups',
			route: '/class-students',
			color: 'bg-tertiary text-on-tertiary'
		},
		{
			label: 'Guru Mapel',
			icon: 'menu_book',
			route: '/subject',
			color: 'bg-primary-container text-on-primary-container'
		},
		{
			label: 'Jadwal Piket',
			icon: 'calendar_today',
			route: '/schedule',
			color: 'bg-secondary-fixed text-on-secondary-fixed'
		}
	];
</script>

<svelte:head>
	<title>Dashboard - Akademik-BN</title>
</svelte:head>

<div class="flex flex-col gap-8">
	<PageHeader title="Dashboard" description="SISTEM INFORMASI AKADEMIK / MODUL PEMETAAN" />

	<!-- Refresh Stats -->
	<div class="flex justify-end">
		<TooltipIconButton
			icon="refresh"
			tooltip={isStatsLoading ? 'Memuat...' : 'Refresh Data'}
			onclick={fetchStats}
			variant={isStatsLoading ? 'ghost' : 'primary'}
		/>
	</div>

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
		<StatCard
			label="Tahun Ajaran"
			value={isStatsLoading ? '...' : activeAcademicYearCode || String(totalAcademicYears)}
		>
			<Icon name="calendar_today" size="28px" class="text-secondary" fill={true} />
		</StatCard>
	</div>

	<!-- Shortcut Buttons -->
	<div class="neo-border bg-surface p-6">
		<h3 class="font-label-caps text-label-caps uppercase mb-4 flex items-center gap-2">
			<Icon name="dashboard" size="18px" />
			Tombol Pintas
		</h3>
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
			{#each shortcuts as s}
				<button
					class="neo-border neo-shadow-sm {s.color} px-2 py-3 flex flex-col items-center gap-3 cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
					onclick={() => goto(s.route)}
				>
					<Icon name={s.icon} size="24px" />
					<span class="font-label-caps text-label-caps uppercase tracking-widest">{s.label}</span>
				</button>
			{/each}
		</div>
	</div>
</div>
