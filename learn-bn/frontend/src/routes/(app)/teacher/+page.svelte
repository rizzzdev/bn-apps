<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import ClassCard from '$lib/components/ClassCard.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let teacherId = $derived(authState.user?.profileId || '');

	let classesPromise = $derived(lmsStore.getTeacherClasses());
	let assignmentsPromise = $derived(lmsStore.getMyAssignments());
	let pendingGradingPromise = $derived(lmsStore.getTeacherPendingGrading());

	function formatDate(dateStr?: string | null): string {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
	}

	const dayMap: Record<string, string> = {
		Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu',
		Thursday: 'Kamis', Friday: 'Jumat', Saturday: 'Sabtu', Sunday: 'Minggu'
	};
	const todayEnglish = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
	const todayIndonesian = dayMap[todayEnglish] || '';
</script>

<svelte:head>
	<title>Dashboard Guru - Akademik-BN</title>
</svelte:head>

<div class="flex justify-between items-end mb-6">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">Dashboard</h2>
		<p class="font-body-md text-secondary">Ringkasan aktivitas mengajar dan penilaian Anda.</p>
	</div>
</div>

{#await classesPromise}
	<div class="animate-pulse space-y-6">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			{#each Array(3) as _}
				<div class="h-24 bg-surface-container neo-border"></div>
			{/each}
		</div>
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-2 h-64 bg-surface-container neo-border"></div>
			<div class="h-64 bg-surface-container neo-border"></div>
		</div>
	</div>
{:then classes}
	{@const totalStudents = classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)}

	<!-- ═══ Row 1: Grading Stats + Quick Info ═══ -->
	{#await pendingGradingPromise}
		<div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6 animate-pulse">
			{#each Array(4) as _}
				<div class="h-24 bg-surface-container neo-border"></div>
			{/each}
		</div>
	{:then gradingData}
		<div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
			<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-3">
				<div class="w-11 h-11 bg-primary-container neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-primary text-lg">rate_review</span>
				</div>
				<div class="min-w-0">
					<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Tugas Dinilai</p>
					<p class="font-headline-md text-xl font-bold">{gradingData?.totalGraded ?? 0}/{gradingData?.totalSubmissions ?? 0}</p>
					<div class="w-full h-1.5 bg-surface-container rounded-full mt-1 overflow-hidden">
						<div class="h-full bg-primary rounded-full transition-all" style="width: {gradingData && gradingData.totalSubmissions > 0 ? ((gradingData.totalGraded ?? 0) / gradingData.totalSubmissions * 100) : 0}%"></div>
					</div>
				</div>
			</div>

			<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-3">
				<div class="w-11 h-11 bg-warning/20 neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-warning text-lg">pending_actions</span>
				</div>
				<div class="min-w-0">
					<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Perlu Dinilai</p>
					<p class="font-headline-md text-xl font-bold">{gradingData?.totalPending ?? 0}</p>
					<p class="font-label-bold text-[10px] text-secondary">{gradingData?.assignments.length ?? 0} tugas</p>
				</div>
			</div>

			<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-3">
				<div class="w-11 h-11 bg-primary-container neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-primary text-lg">school</span>
				</div>
				<div class="min-w-0">
					<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Kelas Diajar</p>
					<p class="font-headline-md text-xl font-bold">{classes.length}</p>
					<a href="/teacher/classes" class="font-label-bold text-[10px] text-primary hover:underline">Kelola</a>
				</div>
			</div>

			<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-3">
				<div class="w-11 h-11 bg-[#10B981]/20 neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-success text-lg">groups</span>
				</div>
				<div class="min-w-0">
					<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Total Siswa</p>
					<p class="font-headline-md text-xl font-bold">{totalStudents}</p>
					<p class="font-label-bold text-[10px] text-secondary">Di semua kelas</p>
				</div>
			</div>
		</div>

		<!-- Pending Alert (only when needed) -->
		{#if gradingData && gradingData.totalPending > 0}
			<div class="bg-[#FEE2E2] border-2 border-error neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-3 mb-6 flex items-center gap-3">
				<span class="material-symbols-outlined text-error text-lg shrink-0">rate_review</span>
				<div class="flex-1 min-w-0">
					<p class="font-label-bold text-xs">
						{gradingData.totalPending} pengumpulan perlu <span class="text-error font-black">dinilai</span>
						— tersebar di {gradingData.assignments.length} tugas
					</p>
				</div>
				<a href="/teacher/grades"
					class="shrink-0 font-label-bold text-[10px] px-3 py-1.5 bg-error text-white neo-border hover:brightness-110 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
				>
					Nilai →
				</a>
			</div>
		{/if}
	{:catch}
		<!-- Stats unavailable -->
	{/await}

	<!-- ═══ Row 2: Schedule + Content Overview ═══ -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
		<!-- Today's Schedule (2/3) -->
		<div class="lg:col-span-2">
			{#await lmsStore.getSchedule(teacherId)}
				<div class="bg-surface-container p-6 neo-border text-center">
					<p class="text-secondary font-bold text-sm">Memuat jadwal...</p>
				</div>
			{:then schedule}
				{@const todaySchedule = schedule.filter((s) => s.day === todayEnglish || s.day === todayIndonesian)}
				<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-5 h-full">
					<div class="flex items-center justify-between border-b-2 border-on-surface pb-3 mb-4">
						<h3 class="font-headline-md text-base font-bold flex items-center gap-2">
							<span class="material-symbols-outlined text-primary text-lg">calendar_view_day</span>
							Jadwal Mengajar Hari Ini
						</h3>
						<a href="/teacher/schedule" class="font-label-bold text-[10px] text-primary hover:underline">Lihat Lengkap</a>
					</div>

					{#if todaySchedule.length === 0}
						<div class="py-5 text-center flex flex-col items-center">
							<span class="material-symbols-outlined text-2xl text-secondary mb-1">event_busy</span>
							<p class="text-secondary font-bold text-xs">Tidak ada jadwal mengajar hari ini.</p>
						</div>
					{:else}
						<div class="flex flex-col gap-1.5">
							{#each todaySchedule.sort((a, b) => a.lessonHour.order - b.lessonHour.order) as slot}
								<div class="flex items-center gap-2.5 p-2.5 bg-surface-container neo-border hover:bg-primary-container/20 transition-colors">
									<div class="w-12 text-center shrink-0">
										<p class="font-label-bold text-[9px] uppercase text-secondary">{slot.lessonHour.startTime}</p>
										<p class="font-label-bold text-[9px] text-secondary">-</p>
										<p class="font-label-bold text-[9px] uppercase text-secondary">{slot.lessonHour.endTime}</p>
									</div>
									<div class="w-0.5 h-8 bg-primary shrink-0"></div>
									<div class="min-w-0 flex-1">
										<p class="font-label-bold text-xs truncate">{slot.subject.name}</p>
										{#if slot.notes}
											<p class="font-label-bold text-[9px] text-secondary truncate">{slot.notes}</p>
										{/if}
									</div>
									{#each slot.classes as c}
										<Badge variant="outline" size="xs">{c.class.name}</Badge>
									{/each}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:catch}
				<div class="bg-surface-container p-6 neo-border text-center">
					<p class="text-secondary font-bold text-sm">Jadwal tidak tersedia.</p>
				</div>
			{/await}
		</div>

		<!-- Content Overview (1/3) -->
		{#await assignmentsPromise}
			<div class="bg-surface-container p-6 neo-border text-center">
				<p class="text-secondary font-bold text-sm">Memuat...</p>
			</div>
		{:then allAssignments}
			{@const publishedCount = allAssignments.filter((a) => a.status === 'Published').length}
			{@const draftCount = allAssignments.filter((a) => a.status === 'Draft').length}
			<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-5">
				<h3 class="font-headline-md text-base font-bold border-b-2 border-on-surface pb-3 mb-4 flex items-center gap-2">
					<span class="material-symbols-outlined text-primary text-lg">inventory_2</span>
					Konten
				</h3>
				<div class="space-y-2">
					<div class="flex items-center justify-between p-2.5 bg-surface-container neo-border">
						<div class="flex items-center gap-2">
							<div class="w-2.5 h-2.5 rounded-full bg-success"></div>
							<span class="font-label-bold text-[10px]">Published</span>
						</div>
						<span class="font-label-bold text-xs">{publishedCount}</span>
					</div>
					<div class="flex items-center justify-between p-2.5 bg-surface-container neo-border">
						<div class="flex items-center gap-2">
							<div class="w-2.5 h-2.5 rounded-full bg-warning"></div>
							<span class="font-label-bold text-[10px]">Draft</span>
						</div>
						<span class="font-label-bold text-xs">{draftCount}</span>
					</div>
					<div class="flex items-center justify-between p-2.5 bg-surface-container neo-border">
						<div class="flex items-center gap-2">
							<div class="w-2.5 h-2.5 rounded-full bg-primary"></div>
							<span class="font-label-bold text-[10px]">Total Tugas</span>
						</div>
						<span class="font-label-bold text-xs">{allAssignments.length}</span>
					</div>
				</div>
				<div class="mt-3 flex gap-2">
					<a href="/teacher/assignments" class="flex-1">
						<Button variant="primary" class="w-full justify-center text-[10px] py-1.5">
							<span class="material-symbols-outlined text-[10px]">manage_search</span>
							Kelola
						</Button>
					</a>
					<a href="/teacher/assignments/new" class="flex-1">
						<Button variant="outline" class="w-full justify-center text-[10px] py-1.5">
							<span class="material-symbols-outlined text-[10px]">add</span>
							Buat
						</Button>
					</a>
				</div>
			</div>
		{:catch}
			<div class="bg-surface-container p-6 neo-border text-center">
				<p class="text-secondary text-sm">Konten tidak tersedia.</p>
			</div>
		{/await}
	</div>

	<!-- ═══ Row 3: Quick Actions + Recent Tasks ═══ -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
		<div class="lg:col-span-2">
			{#await assignmentsPromise}
				<div class="bg-surface-container p-6 neo-border text-center">
					<p class="text-secondary font-bold text-sm">Memuat tugas...</p>
				</div>
			{:then allAssignments}
				{@const recentPublished = allAssignments.filter((a) => a.status === 'Published').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)}
				<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-5">
					<div class="flex items-center justify-between border-b-2 border-on-surface pb-3 mb-4">
						<h3 class="font-headline-md text-base font-bold flex items-center gap-2">
							<span class="material-symbols-outlined text-primary text-lg">assignment</span>
							Tugas Terbaru
						</h3>
						<a href="/teacher/assignments" class="font-label-bold text-[10px] text-primary hover:underline">Lihat Semua</a>
					</div>

					{#if recentPublished.length === 0}
						<div class="py-5 text-center flex flex-col items-center">
							<span class="material-symbols-outlined text-2xl text-secondary mb-1">inbox</span>
							<p class="text-secondary font-bold text-xs">Belum ada tugas dipublikasikan.</p>
							<a href="/teacher/assignments/new" class="mt-2 font-label-bold text-[10px] text-primary hover:underline">Buat tugas pertama →</a>
						</div>
					{:else}
						<div class="flex flex-col gap-1.5">
							{#each recentPublished as a}
								{@const classNames = a.classes?.map((c: any) => c.class?.name).filter(Boolean).join(', ') || 'Kelas'}
								<a href={`/teacher/assignments/${a.id}`}
									class="flex items-center gap-2.5 p-2.5 bg-surface-container neo-border hover:bg-primary-container/20 transition-colors"
								>
									<div class="w-7 h-7 bg-primary-container neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
										<span class="material-symbols-outlined text-xs text-primary">assignment</span>
									</div>
									<div class="min-w-0 flex-1">
										<p class="font-label-bold text-xs truncate">{a.title}</p>
										<p class="font-label-bold text-[9px] text-secondary">Kelas: {classNames} • {formatDate(a.createdAt)}</p>
									</div>
									{#if a.submissionStats}
										<Badge variant="neutral" size="xs">{a.submissionStats.submittedCount}/{a.submissionStats.totalStudents}</Badge>
									{/if}
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{:catch}
				<div class="bg-surface-container p-6 neo-border text-center">
					<p class="text-secondary text-sm">Tugas tidak tersedia.</p>
				</div>
			{/await}
		</div>

		<!-- Quick Actions -->
		<div class="flex flex-col gap-3">
			<h3 class="font-headline-md text-base font-bold border-b-2 border-on-surface pb-2 flex items-center gap-2">
				<span class="material-symbols-outlined text-primary text-lg">bolt</span>
				Aksi Cepat
			</h3>
			<a href="/teacher/assignments/new"
				class="flex items-center gap-3 p-3 bg-surface-container-lowest neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
			>
				<div class="w-9 h-9 bg-primary-container neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-primary text-sm">assignment_add</span>
				</div>
				<span class="font-label-bold text-[10px] uppercase">Tugas Baru</span>
			</a>
			<a href="/teacher/materials/new"
				class="flex items-center gap-3 p-3 bg-surface-container-lowest neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
			>
				<div class="w-9 h-9 bg-primary-container neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-primary text-sm">note_add</span>
				</div>
				<span class="font-label-bold text-[10px] uppercase">Materi Baru</span>
			</a>
			<a href="/teacher/quizzes/new"
				class="flex items-center gap-3 p-3 bg-surface-container-lowest neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
			>
				<div class="w-9 h-9 bg-primary-container neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-primary text-sm">quiz</span>
				</div>
				<span class="font-label-bold text-[10px] uppercase">Kuis Baru</span>
			</a>
			<a href="/teacher/grades"
				class="flex items-center gap-3 p-3 bg-surface-container-lowest neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
			>
				<div class="w-9 h-9 bg-primary-container neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-primary text-sm">grade</span>
				</div>
				<span class="font-label-bold text-[10px] uppercase">Rekap Nilai</span>
			</a>
		</div>
	</div>

	<!-- ═══ Row 4: My Classes ═══ -->
	<div>
		<div class="flex items-center justify-between border-b-2 border-on-surface pb-2 mb-4">
			<h3 class="font-headline-md text-lg font-bold">Daftar Kelas</h3>
			<a href="/teacher/classes" class="font-label-bold text-xs text-primary hover:underline">Lihat Semua</a>
		</div>

		{#if classes.length === 0}
			<div class="bg-surface-container-lowest p-10 neo-border text-center flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
				<div class="w-14 h-14 bg-primary-container neo-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 mb-5">
					<span class="material-symbols-outlined text-3xl">inventory_2</span>
				</div>
				<h4 class="font-headline-md text-lg font-bold mb-1">Belum Ada Kelas</h4>
				<p class="font-body-md text-sm text-secondary">Anda belum mengajar kelas manapun.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each classes as cls}
					<ClassCard {cls} role="teacher" />
				{/each}
			</div>
		{/if}
	</div>
{/await}
