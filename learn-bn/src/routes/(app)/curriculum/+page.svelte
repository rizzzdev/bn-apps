<script lang="ts">
	import { lmsStore, type CurriculumOverview } from '$lib/features/lms/lms-store.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let data = $state<CurriculumOverview | null>(null);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		lmsStore.getCurriculumOverview().then((d) => {
			data = d;
			loading = false;
		}).catch((e) => {
			error = e.message || 'Gagal memuat data';
			loading = false;
		});
	});

	function pct(v: number) { return `${Math.min(100, Math.max(0, v))}%`; }
	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
	}

	const statCards = $derived(data ? [
		{ label: 'Guru', value: data.stats.totalTeachers, icon: 'school', color: 'bg-primary-container' },
		{ label: 'Siswa Aktif', value: data.stats.totalStudents, icon: 'groups', color: 'bg-[#10B981]/20' },
		{ label: 'Kelas', value: data.stats.totalClasses, icon: 'meeting_room', color: 'bg-[#F59E0B]/20' },
		{ label: 'Materi', value: data.stats.totalMaterials, icon: 'menu_book', color: 'bg-[#8B5CF6]/20' },
		{ label: 'Tugas', value: data.stats.totalAssignments, icon: 'assignment', color: 'bg-[#EF4444]/20' },
		{ label: 'Kuis', value: data.stats.totalQuizzes, icon: 'quiz', color: 'bg-[#EC4899]/20' },
	] : []);

	const rates = $derived(data ? [
		{ label: 'Pengumpulan Tugas', value: data.stats.submissionRate, icon: 'task_alt', color: '#10B981' },
		{ label: 'Baca Materi', value: data.stats.materialReadRate, icon: 'chrome_reader_mode', color: '#8B5CF6' },
		{ label: 'Penyelesaian Kuis', value: data.stats.quizCompletionRate, icon: 'quiz', color: '#EC4899' },
	] : []);

	const typeIcon: Record<string, string> = { material: 'menu_book', assignment: 'assignment', quiz: 'quiz' };
</script>

<svelte:head>
	<title>Overview Kurikulum - Akademik-BN</title>
</svelte:head>

<div class="mb-6 flex items-end justify-between">
	<div>
		<h2 class="text-display-lg-mobile font-black tracking-tight text-on-surface uppercase md:text-display-lg">
			Monitoring Kurikulum
		</h2>
		<p class="font-body-md text-secondary">Dashboard Waka Kurikulum — overview aktivitas belajar mengajar.</p>
	</div>
</div>

{#if loading}
	<div class="animate-pulse space-y-6">
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
			{#each Array(6) as _ (Math.random())}
				<div class="h-24 bg-surface-container neo-border"></div>
			{/each}
		</div>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{#each Array(3) as _ (Math.random())}
				<div class="h-28 bg-surface-container neo-border"></div>
			{/each}
		</div>
	</div>
{:else if error}
	<div class="flex flex-col items-center bg-surface-container-lowest p-10 text-center shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] neo-border">
		<span class="material-symbols-outlined mb-3 text-4xl text-error">error</span>
		<p class="font-label-bold text-sm text-error">{error}</p>
	</div>
{:else if data}
	<!-- Stat Cards -->
	<div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
		{#each statCards as s (s.label)}
			<div class="flex items-center gap-2.5 bg-surface-container-lowest p-3 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] neo-border">
				<div class="flex h-10 w-10 shrink-0 items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] neo-border {s.color}">
					<span class="material-symbols-outlined text-base text-on-surface">{s.icon}</span>
				</div>
				<div class="min-w-0">
					<p class="font-label-bold text-[9px] tracking-wider text-secondary uppercase">{s.label}</p>
					<p class="font-headline-md text-lg font-bold">{s.value}</p>
				</div>
			</div>
		{/each}
	</div>

	<!-- Rates + Backlog -->
	<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
		{#each rates as r (r.label)}
			<div class="bg-surface-container-lowest p-4 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] neo-border">
				<div class="mb-2 flex items-center gap-2">
					<span class="material-symbols-outlined text-base" style="color:{r.color}">{r.icon}</span>
					<p class="font-label-bold text-[10px] text-secondary uppercase">{r.label}</p>
				</div>
				<p class="font-headline-md text-xl font-bold">{r.value}%</p>
				<div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-container">
					<div class="h-full rounded-full transition-all" style="width:{pct(r.value)}; background:{r.color}"></div>
				</div>
			</div>
		{/each}

		{#if data.stats.ungradedBacklog > 0}
			<div class="bg-surface-container-lowest p-4 shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] neo-border border-2 border-error">
				<div class="mb-2 flex items-center gap-2">
					<span class="material-symbols-outlined text-base text-error">pending_actions</span>
					<p class="font-label-bold text-[10px] text-error uppercase">Backlog Penilaian</p>
				</div>
				<p class="font-headline-md text-xl font-bold text-error">{data.stats.ungradedBacklog}</p>
				<p class="font-label-bold text-[9px] text-secondary">belum dinilai</p>
			</div>
		{/if}
	</div>

	<!-- Main Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Top Teachers -->
		<div class="bg-surface-container-lowest p-5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] neo-border">
			<h3 class="mb-4 flex items-center gap-2 border-b-2 border-on-surface pb-3 font-headline-md text-base font-bold">
				<span class="material-symbols-outlined text-lg text-primary">military_tech</span>
				Guru Paling Aktif
			</h3>
			{#if data.topTeachers.length === 0}
				<p class="py-4 text-center text-xs text-secondary">Belum ada data guru.</p>
			{:else}
				<div class="flex flex-col gap-2">
					{#each data.topTeachers as t, i}
						<div class="flex items-center gap-3 bg-surface-container p-2.5 neo-border transition-colors hover:bg-primary-container/10">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center bg-primary-container shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] neo-border font-label-bold text-xs">
								{i + 1}
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate font-label-bold text-xs">{t.fullname}</p>
								<p class="font-label-bold text-[9px] text-secondary">{t.materialsCount} materi · {t.assignmentCount} tugas · {t.quizCount} kuis</p>
							</div>
							<Badge variant={t.gradedRate >= 80 ? 'success' : 'warning'} size="xs">Nilai {t.gradedRate}%</Badge>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Low Activity Teachers -->
		<div class="bg-surface-container-lowest p-5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] neo-border">
			<h3 class="mb-4 flex items-center gap-2 border-b-2 border-on-surface pb-3 font-headline-md text-base font-bold">
				<span class="material-symbols-outlined text-lg text-warning">warning</span>
				Guru Perlu Perhatian
			</h3>
			{#if data.lowActivityTeachers.length === 0}
				<p class="py-4 text-center text-xs text-success">Semua guru aktif!</p>
			{:else}
				<div class="flex flex-col gap-2">
					{#each data.lowActivityTeachers as t}
						<div class="flex items-center gap-3 bg-surface-container p-2.5 neo-border border-l-4 border-l-warning">
							<span class="material-symbols-outlined text-warning shrink-0">person_off</span>
							<div class="min-w-0 flex-1">
								<p class="truncate font-label-bold text-xs">{t.fullname}</p>
								<p class="font-label-bold text-[9px] text-secondary">Tidak ada aktivitas 14 hari terakhir</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Underperforming Classes -->
		<div class="bg-surface-container-lowest p-5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] neo-border">
			<h3 class="mb-4 flex items-center gap-2 border-b-2 border-on-surface pb-3 font-headline-md text-base font-bold">
				<span class="material-symbols-outlined text-lg text-error">trending_down</span>
				Kelas Rendah Partisipasi
			</h3>
			{#if data.underperformingClasses.length === 0}
				<p class="py-4 text-center text-xs text-success">Semua kelas partisipasi baik!</p>
			{:else}
				<div class="flex flex-col gap-2">
					{#each data.underperformingClasses as c}
						<div class="flex items-center gap-3 bg-surface-container p-2.5 neo-border">
							<div class="min-w-0 flex-1">
								<p class="truncate font-label-bold text-xs">{c.className}</p>
							</div>
							<Badge variant="error" size="xs">{c.submissionRate}%</Badge>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Recent Activity -->
		<div class="bg-surface-container-lowest p-5 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] neo-border">
			<h3 class="mb-4 flex items-center gap-2 border-b-2 border-on-surface pb-3 font-headline-md text-base font-bold">
				<span class="material-symbols-outlined text-lg text-primary">history</span>
				Aktivitas Terbaru
			</h3>
			{#if data.recentActivity.length === 0}
				<p class="py-4 text-center text-xs text-secondary">Belum ada aktivitas.</p>
			{:else}
				<div class="flex flex-col gap-1.5">
					{#each data.recentActivity as a}
						<div class="flex items-center gap-2.5 bg-surface-container p-2 neo-border">
							<span class="material-symbols-outlined shrink-0 text-sm text-secondary">{typeIcon[a.type] ?? 'circle'}</span>
							<div class="min-w-0 flex-1">
								<p class="truncate font-label-bold text-[10px]">{a.title}</p>
								<p class="font-label-bold text-[8px] text-secondary">{a.teacherName} · {formatDate(a.createdAt)}</p>
							</div>
							<Badge variant="neutral" size="xs">{a.type}</Badge>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
