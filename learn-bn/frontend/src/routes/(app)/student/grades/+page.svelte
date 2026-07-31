<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import Card from '$lib/components/Card.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import CustomSelect from '$lib/components/CustomSelect.svelte';

	let studentId = $derived(authState.user?.id || '');

	let classesPromise = $derived(lmsStore.getStudentClasses(studentId));

	let selectedClassId = $state('');
	let gradesPromise = $state<Promise<any>>(Promise.resolve(null));

	$effect(() => {
		if (selectedClassId) {
			gradesPromise = lmsStore.getMyGrades(selectedClassId);
		} else {
			gradesPromise = Promise.resolve(null);
		}
	});

	function daysUntil(dateStr: string): string {
		const now = new Date();
		const target = new Date(dateStr);
		const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		if (diff < 0) return 'Terlewat';
		if (diff === 0) return 'Hari ini';
		if (diff === 1) return 'Besok';
		return `${diff} hari lagi`;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function getDeadlineClass(days: string): string {
		if (days === 'Terlewat') return 'text-error';
		if (days === 'Hari ini' || days === 'Besok') return 'text-warning';
		return 'text-on-surface';
	}
</script>

<svelte:head>
	<title>Rekap Nilai - Akademik-BN</title>
</svelte:head>

<div class="flex justify-between items-end mb-6 mt-4">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">
			Rekap Nilai
		</h2>
		<p class="font-body-md text-secondary">Pantau nilai tugas dan kuis Anda secara real-time.</p>
	</div>
</div>

{#await classesPromise}
	<div class="animate-pulse space-y-4">
		<div class="h-12 bg-surface-container neo-border w-full max-w-md"></div>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			{#each Array(3) as _}
				<div class="h-24 bg-surface-container neo-border"></div>
			{/each}
		</div>
	</div>
{:then classes}
	{#if classes.length === 0}
		<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-secondary mb-4">sentiment_dissatisfied</span>
			<p class="font-bold text-secondary text-lg">Anda belum terdaftar di kelas mana pun.</p>
			<p class="text-secondary text-sm mt-2">Hubungi admin untuk mendaftarkan Anda ke dalam kelas.</p>
		</div>
	{:else}
		<!-- Class Selector -->
		<div class="mb-8 max-w-md">
			<CustomSelect
				label="Pilih Kelas"
				options={[
					{ value: '', label: '-- Pilih Kelas --' },
					...classes.map((cls: any) => ({ value: cls.id, label: cls.name }))
				]}
				bind:value={selectedClassId}
				placeholder="-- Pilih Kelas --"
			/>
		</div>

		{#if selectedClassId}
			{#await gradesPromise}
				<div class="animate-pulse space-y-4">
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{#each Array(3) as _}
							<div class="h-24 bg-surface-container neo-border"></div>
						{/each}
					</div>
					{#each Array(3) as _}
						<div class="h-20 bg-surface-container neo-border"></div>
					{/each}
				</div>
			{:then grades}
				{#if !grades}
					<div class="bg-surface-container p-12 neo-border text-center flex flex-col items-center">
						<span class="material-symbols-outlined text-6xl text-secondary mb-4">inbox</span>
						<p class="font-bold text-secondary text-lg">Belum ada data nilai untuk kelas ini.</p>
						<p class="text-secondary text-sm mt-2">Data nilai akan muncul setelah guru melakukan penilaian.</p>
					</div>
				{:else}
					{@const assignCount = grades.assignments?.length ?? 0}
					{@const quizCount = grades.quizzes?.length ?? 0}
					{@const gradedAssign = (grades.assignments ?? []).filter((a: any) => a.grade !== null)}
					{@const completedQuizzes = (grades.quizzes ?? []).filter((q: any) => q.score !== null)}
					{@const avgAssignGrade = gradedAssign.length > 0
						? Math.round(gradedAssign.reduce((sum: number, a: any) => sum + a.grade, 0) / gradedAssign.length)
						: null}
					{@const avgQuizScore = completedQuizzes.length > 0
						? Math.round(completedQuizzes.reduce((sum: number, q: any) => sum + q.score, 0) / completedQuizzes.length)
						: null}
					{@const submittedCount = (grades.assignments ?? []).filter((a: any) => a.status !== 'not_submitted').length}

					<!-- Summary Stats -->
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-4">
							<div class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shrink-0">
								<span class="material-symbols-outlined text-primary">assignment</span>
							</div>
							<div class="min-w-0">
								<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Total Tugas</p>
								<p class="font-headline-md text-2xl font-bold">{assignCount}</p>
								<p class="font-label-bold text-[11px] text-secondary">
									{submittedCount} dikerjakan
								</p>
							</div>
						</div>

						<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-4">
							<div class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shrink-0">
								<span class="material-symbols-outlined text-primary">quiz</span>
							</div>
							<div class="min-w-0">
								<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Total Kuis</p>
								<p class="font-headline-md text-2xl font-bold">{quizCount}</p>
								<p class="font-label-bold text-[11px] text-secondary">
									{completedQuizzes.length} dikerjakan
								</p>
							</div>
						</div>

						<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-4">
							<div class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shrink-0">
								<span class="material-symbols-outlined text-primary">show_chart</span>
							</div>
							<div class="min-w-0">
								<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Nilai Tugas</p>
								<p class="font-headline-md text-2xl font-bold {avgAssignGrade !== null ? (avgAssignGrade >= 75 ? 'text-success' : 'text-error') : 'text-secondary'}">
									{avgAssignGrade !== null ? avgAssignGrade : '-'}
								</p>
								<p class="font-label-bold text-[11px] text-secondary">
									{avgAssignGrade !== null ? (avgAssignGrade >= 75 ? '✅ Lulus' : '❌ Remedial') : 'Belum dinilai'}
								</p>
							</div>
						</div>

						<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-4">
							<div class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shrink-0">
								<span class="material-symbols-outlined text-primary">analytics</span>
							</div>
							<div class="min-w-0">
								<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Skor Kuis</p>
								<p class="font-headline-md text-2xl font-bold {avgQuizScore !== null ? (avgQuizScore >= 75 ? 'text-success' : 'text-error') : 'text-secondary'}">
									{avgQuizScore !== null ? avgQuizScore : '-'}
								</p>
								<p class="font-label-bold text-[11px] text-secondary">
									{avgQuizScore !== null ? (avgQuizScore >= 75 ? '✅ Lulus' : '❌ Remedial') : 'Belum dinilai'}
								</p>
							</div>
						</div>
					</div>

					<div class="space-y-8">
						<!-- Assignment Grades -->
						<Card>
							<div class="flex items-center justify-between mb-6 border-b-2 border-on-surface pb-3">
								<h3 class="font-headline-md text-xl font-bold flex items-center gap-2">
									<span class="material-symbols-outlined">assignment</span>
									Nilai Tugas
								</h3>
								{#if assignCount > 0}
									<span class="font-label-bold text-xs text-secondary">
										{gradedAssign.length}/{assignCount} dinilai
									</span>
								{/if}
							</div>

							{#if assignCount === 0}
								<div class="py-8 text-center flex flex-col items-center">
									<span class="material-symbols-outlined text-4xl text-secondary mb-2">inbox</span>
									<p class="text-secondary italic">Belum ada tugas untuk kelas ini.</p>
								</div>
							{:else}
								<div class="flex flex-col gap-3">
									{#each grades.assignments as a}
										{@const days = daysUntil(a.deadline)}
										{@const isPast = days === 'Terlewat'}
										{@const gradeColor = a.grade !== null ? (a.grade >= 75 ? 'text-success' : 'text-error') : ''}
										<div
											class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
										>
											<div class="min-w-0 flex-1">
												<div class="flex items-center gap-2 flex-wrap">
													<p class="font-label-bold text-sm">{a.title}</p>
													{#if a.status === 'graded' && a.grade !== null}
														<Badge variant="success" size="xs" icon="check_circle">Tergrading</Badge>
													{:else if a.status === 'pending'}
														<Badge variant="warning" size="xs" icon="hourglass_top">Menunggu</Badge>
													{:else if isPast}
														<Badge variant="error" size="xs" icon="warning">Terlewat</Badge>
													{:else}
														<Badge variant="neutral" size="xs" icon="pending">Belum</Badge>
													{/if}
												</div>
												<div class="flex items-center gap-3 mt-1.5 flex-wrap">
													<span class="font-label-bold text-[10px] uppercase text-secondary flex items-center gap-1">
														<span class="material-symbols-outlined text-[12px]">calendar_today</span>
														{formatDate(a.deadline)}
													</span>
													<span class="font-label-bold text-[10px] uppercase flex items-center gap-1 {getDeadlineClass(days)}">
														<span class="material-symbols-outlined text-[12px]">schedule</span>
														{days}
													</span>
												</div>
											</div>

											<div class="shrink-0 flex items-center gap-3">
												{#if a.grade !== null}
													<div class="px-4 py-2 bg-surface-container-lowest neo-border font-label-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center min-w-[80px]">
														<span class="text-[10px] uppercase text-secondary block -mt-0.5">Nilai</span>
														<span class="text-xl {gradeColor}">{a.grade}</span>
													</div>
												{:else if a.status === 'pending'}
													<Badge variant="warning" size="sm">Menunggu Penilaian</Badge>
												{:else if isPast}
													<Badge variant="error" size="sm">Tidak Dikerjakan</Badge>
												{:else}
													<Badge variant="neutral" size="sm">Belum Dikerjakan</Badge>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</Card>

						<!-- Quiz Scores -->
						<Card>
							<div class="flex items-center justify-between mb-6 border-b-2 border-on-surface pb-3">
								<h3 class="font-headline-md text-xl font-bold flex items-center gap-2">
									<span class="material-symbols-outlined">quiz</span>
									Nilai Kuis
								</h3>
								{#if quizCount > 0}
									<span class="font-label-bold text-xs text-secondary">
										{completedQuizzes.length}/{quizCount} dikerjakan
									</span>
								{/if}
							</div>

							{#if quizCount === 0}
								<div class="py-8 text-center flex flex-col items-center">
									<span class="material-symbols-outlined text-4xl text-secondary mb-2">inbox</span>
									<p class="text-secondary italic">Belum ada kuis untuk kelas ini.</p>
								</div>
							{:else}
								<div class="flex flex-col gap-3">
									{#each grades.quizzes as q}
										{@const scoreColor = q.score !== null ? (q.score >= 75 ? 'text-success' : 'text-error') : ''}
										{@const scorePercent = q.score !== null ? Math.round(q.score) : null}
										<div
											class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-container neo-border shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-4 gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
										>
											<div class="min-w-0 flex-1">
												<div class="flex items-center gap-2 flex-wrap">
													<p class="font-label-bold text-sm">{q.title}</p>
													{#if q.score !== null}
														<Badge variant="success" size="xs" icon="check_circle">Selesai</Badge>
													{:else}
														<Badge variant="neutral" size="xs" icon="pending">Belum</Badge>
													{/if}
												</div>
												{#if q.score !== null}
													<div class="mt-1.5 w-full max-w-[200px] bg-surface-container-high neo-border h-2 overflow-hidden">
														<div
															class="h-full transition-all duration-500 {q.score >= 75 ? 'bg-success' : 'bg-error'}"
															style="width: {Math.min(scorePercent ?? 0, 100)}%"
														></div>
													</div>
												{/if}
											</div>

											<div class="shrink-0 flex items-center gap-3">
												{#if q.score !== null}
													<div class="px-4 py-2 bg-surface-container-lowest neo-border font-label-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center min-w-[80px]">
														<span class="text-[10px] uppercase text-secondary block -mt-0.5">Skor</span>
														<span class="text-xl {scoreColor}">{scorePercent}</span>
													</div>
												{:else}
													<Badge variant="neutral" size="sm">Belum Dikerjakan</Badge>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</Card>
					</div>
				{/if}
			{:catch error}
				<div class="bg-error-container p-12 neo-border text-center flex flex-col items-center">
					<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
					<p class="font-bold text-error text-lg">Gagal memuat nilai.</p>
					<p class="text-error text-sm mt-2">{error.message}</p>
				</div>
			{/await}
		{/if}
	{/if}
{:catch error}
	<div class="bg-error-container p-12 neo-border text-center flex flex-col items-center">
		<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
		<p class="font-bold text-error text-lg">Gagal memuat kelas.</p>
		<p class="text-error text-sm mt-2">{error.message}</p>
	</div>
{/await}
