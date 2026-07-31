<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import ClassCard from '$lib/components/ClassCard.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let studentId = $derived(authState.user?.profileId || '');

	let classesPromise = $derived(lmsStore.getStudentClasses(studentId));
	let pendingItemsPromise = $derived(lmsStore.getStudentPendingItems());

	function daysUntil(dateStr: string): string {
		const now = new Date();
		const target = new Date(dateStr);
		const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		if (diff < 0) return 'Terlewat';
		if (diff === 0) return 'Hari ini';
		if (diff === 1) return 'Besok';
		return `${diff} hari lagi`;
	}

	function formatDateShort(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
	}

	const dayMap: Record<string, string> = {
		Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu',
		Thursday: 'Kamis', Friday: 'Jumat', Saturday: 'Sabtu', Sunday: 'Minggu'
	};
	const todayEnglish = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
	const todayIndonesian = dayMap[todayEnglish] || '';
</script>

<svelte:head>
	<title>Dashboard Murid - Akademik-BN</title>
</svelte:head>

<div class="flex justify-between items-end mb-6">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">Dashboard</h2>
		<p class="font-body-md text-secondary">Pantau progres belajar dan aktivitas kelas Anda.</p>
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
	{@const classCount = classes.length}

	<!-- ═══ Row 1: Progress Stats & Pending Alert ═══ -->
	{#await pendingItemsPromise}
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-pulse">
			{#each Array(3) as _}
				<div class="h-24 bg-surface-container neo-border"></div>
			{/each}
		</div>
	{:then statData}
		{#if statData}
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
				<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-3">
					<div class="w-11 h-11 bg-primary-container neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
						<span class="material-symbols-outlined text-primary text-lg">assignment</span>
					</div>
					<div class="min-w-0">
						<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Tugas Dikerjakan</p>
						<p class="font-headline-md text-xl font-bold">{statData.totalSubmittedAssignments}/{statData.totalAssignments}</p>
						<div class="w-full h-1.5 bg-surface-container rounded-full mt-1 overflow-hidden">
							<div class="h-full bg-primary rounded-full transition-all" style="width: {statData.totalAssignments > 0 ? (statData.totalSubmittedAssignments / statData.totalAssignments * 100) : 0}%"></div>
						</div>
					</div>
				</div>

				<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-3">
					<div class="w-11 h-11 bg-[#10B981]/20 neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
						<span class="material-symbols-outlined text-success text-lg">menu_book</span>
					</div>
					<div class="min-w-0">
						<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Materi Dibaca</p>
						<p class="font-headline-md text-xl font-bold">{statData.totalReadMaterials}/{statData.totalMaterials}</p>
						<div class="w-full h-1.5 bg-surface-container rounded-full mt-1 overflow-hidden">
							<div class="h-full bg-success rounded-full transition-all" style="width: {statData.totalMaterials > 0 ? (statData.totalReadMaterials / statData.totalMaterials * 100) : 0}%"></div>
						</div>
					</div>
				</div>

				<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-3">
					<div class="w-11 h-11 bg-warning/20 neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
						<span class="material-symbols-outlined text-warning text-lg">quiz</span>
					</div>
					<div class="min-w-0">
						<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Kuis Dikerjakan</p>
						<p class="font-headline-md text-xl font-bold">{statData.totalDoneQuizzes}/{statData.totalQuizzes}</p>
						<div class="w-full h-1.5 bg-surface-container rounded-full mt-1 overflow-hidden">
							<div class="h-full bg-warning rounded-full transition-all" style="width: {statData.totalQuizzes > 0 ? (statData.totalDoneQuizzes / statData.totalQuizzes * 100) : 0}%"></div>
						</div>
					</div>
				</div>
			</div>

			{@const totalPendingAll = statData.totalUnreadMaterials + statData.totalPendingAssignments + statData.totalPendingQuizzes}
			{#if totalPendingAll > 0}
				<div class="bg-[#FEF3C7] border-2 border-warning neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-3 mb-6 flex items-center gap-3">
					<span class="material-symbols-outlined text-warning text-lg shrink-0">notifications_active</span>
					<p class="font-label-bold text-xs flex-1">
						{totalPendingAll} aktivitas menunggu —
						{#if statData.totalUnreadMaterials > 0}<span class="font-bold">{statData.totalUnreadMaterials} materi</span>{/if}
						{#if statData.totalUnreadMaterials > 0 && (statData.totalPendingAssignments > 0 || statData.totalPendingQuizzes > 0)} • {/if}
						{#if statData.totalPendingAssignments > 0}<span class="font-bold">{statData.totalPendingAssignments} tugas</span>{/if}
						{#if statData.totalPendingQuizzes > 0 && statData.totalPendingAssignments > 0} • {/if}
						{#if statData.totalPendingQuizzes > 0}<span class="font-bold">{statData.totalPendingQuizzes} kuis</span>{/if}
					</p>
					<a href="#pending-detail" class="font-label-bold text-xs text-warning hover:underline shrink-0">Lihat</a>
				</div>
			{/if}
		{/if}
	{:catch}
		<!-- Stats unavailable -->
	{/await}

	<!-- ═══ Row 2: Schedule + Deadlines ═══ -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
		<!-- Today's Schedule (2/3) -->
		<div class="lg:col-span-2">
			{#await lmsStore.getStudentSchedule(studentId)}
				<div class="bg-surface-container p-6 neo-border text-center">
					<p class="text-secondary font-bold text-sm">Memuat jadwal...</p>
				</div>
			{:then schedule}
				{@const todaySchedule = schedule.filter((s) => s.day === todayEnglish || s.day === todayIndonesian)}
				<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-5 h-full">
					<div class="flex items-center justify-between border-b-2 border-on-surface pb-3 mb-4">
						<h3 class="font-headline-md text-base font-bold flex items-center gap-2">
							<span class="material-symbols-outlined text-primary text-lg">calendar_view_day</span>
							Jadwal Hari Ini
						</h3>
						<a href="/student/schedule" class="font-label-bold text-[10px] text-primary hover:underline">Lihat Lengkap</a>
					</div>

					{#if todaySchedule.length === 0}
						<div class="py-5 text-center flex flex-col items-center">
							<span class="material-symbols-outlined text-2xl text-secondary mb-1">event_busy</span>
							<p class="text-secondary font-bold text-xs">Tidak ada jadwal hari ini.</p>
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
									</div>
									{#each slot.teachers as t}
										<span class="font-label-bold text-[9px] text-secondary hidden sm:block truncate max-w-[80px]">
											{t.teacher.fullname}
										</span>
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

		<!-- Upcoming Deadlines (1/3) -->
		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-5">
			<div class="flex items-center justify-between border-b-2 border-on-surface pb-3 mb-4">
				<h3 class="font-headline-md text-base font-bold flex items-center gap-2">
					<span class="material-symbols-outlined text-primary text-lg">event</span>
					Deadline
				</h3>
				<a href="/student/assignments" class="font-label-bold text-[10px] text-primary hover:underline">Semua</a>
			</div>

			{#if classCount === 0}
				<div class="py-5 text-center">
					<span class="material-symbols-outlined text-2xl text-secondary mb-1">event_note</span>
					<p class="text-secondary text-xs font-bold">Belum ada kelas.</p>
				</div>
			{:else}
				{#await Promise.all(classes.slice(0, 2).map((c) => lmsStore.getAssignmentsByClass(c.id)))}
					<div class="space-y-2">
						{#each Array(3) as _}
							<div class="h-14 bg-surface-container neo-border animate-pulse"></div>
						{/each}
					</div>
				{:then results}
					{@const allAssigns = results.flat().filter((a) => a.status === 'Published').sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 5)}
					{#if allAssigns.length === 0}
						<div class="py-5 text-center">
							<span class="material-symbols-outlined text-2xl text-secondary mb-1">check_circle</span>
							<p class="text-secondary text-xs font-bold">Tidak ada deadline.</p>
						</div>
					{:else}
						<div class="flex flex-col gap-1.5">
							{#each allAssigns as a}
								{@const days = daysUntil(a.deadline)}
								<a href={`/student/assignments/${a.id}`}
									class="flex items-center gap-2.5 p-2.5 bg-surface-container neo-border hover:bg-primary-container/20 transition-colors"
								>
									<div class="w-7 h-7 bg-primary-container neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
										<span class="material-symbols-outlined text-xs text-primary">assignment</span>
									</div>
									<div class="min-w-0 flex-1">
										<p class="font-label-bold text-xs truncate">{a.title}</p>
										<p class="font-label-bold text-[9px] text-secondary">{formatDateShort(a.deadline)}</p>
									</div>
									<Badge variant={days === 'Terlewat' ? 'error' : days === 'Hari ini' || days === 'Besok' ? 'warning' : 'neutral'} size="xs">
										{days}
									</Badge>
								</a>
							{/each}
						</div>
					{/if}
				{:catch}
					<div class="py-5 text-center">
						<p class="text-secondary text-xs">Deadline tidak tersedia.</p>
					</div>
				{/await}
			{/if}
		</div>
	</div>

	<!-- ═══ Row 3: Quick Navigation ═══ -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
		<a href="/student/assignments"
			class="flex flex-col items-center gap-2 p-4 bg-surface-container-lowest neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
		>
			<div class="w-10 h-10 bg-primary-container neo-border flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
				<span class="material-symbols-outlined text-primary text-lg">assignment</span>
			</div>
			<span class="font-label-bold text-[10px] uppercase text-center">Tugas</span>
		</a>
		<a href="/student/materials"
			class="flex flex-col items-center gap-2 p-4 bg-surface-container-lowest neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
		>
			<div class="w-10 h-10 bg-primary-container neo-border flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
				<span class="material-symbols-outlined text-primary text-lg">menu_book</span>
			</div>
			<span class="font-label-bold text-[10px] uppercase text-center">Materi</span>
		</a>
		<a href="/student/quizzes"
			class="flex flex-col items-center gap-2 p-4 bg-surface-container-lowest neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
		>
			<div class="w-10 h-10 bg-primary-container neo-border flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
				<span class="material-symbols-outlined text-primary text-lg">quiz</span>
			</div>
			<span class="font-label-bold text-[10px] uppercase text-center">Kuis</span>
		</a>
		<a href="/student/grades"
			class="flex flex-col items-center gap-2 p-4 bg-surface-container-lowest neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
		>
			<div class="w-10 h-10 bg-primary-container neo-border flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
				<span class="material-symbols-outlined text-primary text-lg">analytics</span>
			</div>
			<span class="font-label-bold text-[10px] uppercase text-center">Nilai</span>
		</a>
	</div>

	<!-- ═══ Row 4: Pending Items Detail ═══ -->
	<div id="pending-detail">
	{#await pendingItemsPromise}
		<div class="bg-surface-container p-6 neo-border text-center">
			<p class="text-secondary font-bold text-sm">Memuat...</p>
		</div>
	{:then pendingData}
		{#if pendingData && (pendingData.materials.length > 0 || pendingData.assignments.length > 0 || pendingData.quizzes.length > 0)}
			<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-5 mb-8">
				<h3 class="font-headline-md text-base font-bold border-b-2 border-on-surface pb-3 mb-4 flex items-center gap-2">
					<span class="material-symbols-outlined text-warning text-lg">checklist</span>
					Yang Perlu Kamu Kerjakan
				</h3>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					{#if pendingData.materials.length > 0}
						<div>
							<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider mb-2 flex items-center gap-1">
								<span class="material-symbols-outlined text-sm text-info">menu_book</span>
								Materi ({pendingData.totalUnreadMaterials})
							</p>
							<div class="flex flex-col gap-1">
								{#each pendingData.materials.slice(0, 4) as m}
									<a href={`/student/materials/${m.id}`}
										class="flex items-center gap-2 p-2 bg-surface-container neo-border hover:bg-primary-container/20 transition-colors"
									>
										<div class="w-6 h-6 bg-info/20 neo-border flex items-center justify-center shrink-0">
											<span class="material-symbols-outlined text-[10px] text-info">description</span>
										</div>
										<div class="min-w-0 flex-1">
											<p class="font-label-bold text-[10px] truncate">{m.title}</p>
											<p class="font-label-bold text-[8px] text-secondary">{m.className}</p>
										</div>
									</a>
								{/each}
								{#if pendingData.materials.length > 4}
									<a href="/student/materials" class="font-label-bold text-[9px] text-primary text-center hover:underline">+{pendingData.materials.length - 4} lagi</a>
								{/if}
							</div>
						</div>
					{/if}

					{#if pendingData.assignments.length > 0}
						<div>
							<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider mb-2 flex items-center gap-1">
								<span class="material-symbols-outlined text-sm text-primary">assignment</span>
								Tugas ({pendingData.totalPendingAssignments})
							</p>
							<div class="flex flex-col gap-1">
								{#each pendingData.assignments.slice(0, 4) as a}
									{@const days = daysUntil(a.deadline)}
									<a href={`/student/assignments/${a.id}`}
										class="flex items-center gap-2 p-2 bg-surface-container neo-border hover:bg-primary-container/20 transition-colors"
									>
										<div class="w-6 h-6 bg-primary-container neo-border flex items-center justify-center shrink-0">
											<span class="material-symbols-outlined text-[10px] text-primary">assignment</span>
										</div>
										<div class="min-w-0 flex-1">
											<p class="font-label-bold text-[10px] truncate">{a.title}</p>
											<p class="font-label-bold text-[8px] text-secondary">{a.className}</p>
										</div>
										<Badge variant={days === 'Terlewat' ? 'error' : days === 'Hari ini' || days === 'Besok' ? 'warning' : 'neutral'} size="xs">{days}</Badge>
									</a>
								{/each}
								{#if pendingData.assignments.length > 4}
									<a href="/student/assignments" class="font-label-bold text-[9px] text-primary text-center hover:underline">+{pendingData.assignments.length - 4} lagi</a>
								{/if}
							</div>
						</div>
					{/if}

					{#if pendingData.quizzes.length > 0}
						<div>
							<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider mb-2 flex items-center gap-1">
								<span class="material-symbols-outlined text-sm text-warning">quiz</span>
								Kuis ({pendingData.totalPendingQuizzes})
							</p>
							<div class="flex flex-col gap-1">
								{#each pendingData.quizzes.slice(0, 4) as q}
									<a href={`/student/quizzes/${q.id}`}
										class="flex items-center gap-2 p-2 bg-surface-container neo-border hover:bg-primary-container/20 transition-colors"
									>
										<div class="w-6 h-6 bg-warning/20 neo-border flex items-center justify-center shrink-0">
											<span class="material-symbols-outlined text-[10px] text-warning">quiz</span>
										</div>
										<div class="min-w-0 flex-1">
											<p class="font-label-bold text-[10px] truncate">{q.title}</p>
											<p class="font-label-bold text-[8px] text-secondary">{q.className} • {q.questionCount} soal</p>
										</div>
									</a>
								{/each}
								{#if pendingData.quizzes.length > 4}
									<a href="/student/quizzes" class="font-label-bold text-[9px] text-primary text-center hover:underline">+{pendingData.quizzes.length - 4} lagi</a>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{:catch}
		<!-- Silent fail -->
	{/await}
	</div>

	<!-- ═══ Row 5: My Classes ═══ -->
	<div>
		<div class="flex items-center justify-between border-b-2 border-on-surface pb-2 mb-4">
			<h3 class="font-headline-md text-lg font-bold">Kelas Saya</h3>
			<a href="/student/classes" class="font-label-bold text-xs text-primary hover:underline">Lihat Semua</a>
		</div>

		{#if classCount === 0}
			<div class="bg-surface-container-lowest p-10 neo-border text-center flex flex-col items-center shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
				<div class="w-14 h-14 bg-primary-container neo-border flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3 mb-5">
					<span class="material-symbols-outlined text-3xl">sentiment_dissatisfied</span>
				</div>
				<h4 class="font-headline-md text-lg font-bold mb-1">Belum Ada Kelas</h4>
				<p class="font-body-md text-sm text-secondary">Anda belum terdaftar di kelas mana pun.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each classes as cls}
					<ClassCard {cls} role="student" />
				{/each}
			</div>
		{/if}
	</div>
{/await}
