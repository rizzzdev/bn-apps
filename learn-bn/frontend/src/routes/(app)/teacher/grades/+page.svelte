<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore, type GradeData } from '$lib/features/lms/lms-store.svelte';
	import CustomSelect, { type SelectOption } from '$lib/components/CustomSelect.svelte';
	import Card from '$lib/components/Card.svelte';

	let classes: Awaited<ReturnType<typeof lmsStore.getTeacherClasses>> = $state([]);
	let selectedClassId = $state('');

	let classOptions = $derived<SelectOption[]>([
		{ value: '', label: '-- Pilih kelas --' },
		...classes.map((cls: any) => ({
			value: cls.id,
			label: `${cls.name} - ${cls.major?.name || ''}`
		}))
	]);
	let gradeData = $state<GradeData | null>(null);
	let loadingClasses = $state(true);
	let loadingGrades = $state(false);
	let errorMsg = $state('');

	$effect(() => {
		async function load() {
			loadingClasses = true;
			try {
				classes = await lmsStore.getTeacherClasses();
			} catch (err: any) {
				errorMsg = err.message || 'Gagal memuat kelas';
			} finally {
				loadingClasses = false;
			}
		}
		load();
	});

	$effect(() => {
		if (!selectedClassId) return;
		async function loadGrades() {
			loadingGrades = true;
			errorMsg = '';
			try {
				gradeData = await lmsStore.getClassGrades(selectedClassId);
			} catch (err: any) {
				errorMsg = err.message || 'Gagal memuat nilai';
				gradeData = null;
			} finally {
				loadingGrades = false;
			}
		}
		loadGrades();
	});

	// ─── Derived Stats ─────────────────────────────
	let totalStudents = $derived(gradeData?.students?.length ?? 0);
	let totalAssignments = $derived(gradeData?.assignments?.length ?? 0);
	let totalQuizzes = $derived(gradeData?.quizzes?.length ?? 0);

	let allGrades = $derived(
		(gradeData?.students ?? []).flatMap((s: any) =>
			s.assignments.filter((a: any) => a.grade !== null).map((a: any) => a.grade!)
		)
	);
	let allScores = $derived(
		(gradeData?.students ?? []).flatMap((s: any) =>
			s.quizzes.filter((q: any) => q.score !== null).map((q: any) => q.score!)
		)
	);
	let classAvg = $derived(
		allGrades.length + allScores.length > 0
			? Math.round(
					(allGrades.reduce((sum: number, g: number) => sum + g, 0) + allScores.reduce((sum: number, s: number) => sum + s, 0)) /
						(allGrades.length + allScores.length)
				)
			: null
	);

	let assignAvgOverall = $derived(
		allGrades.length > 0
			? Math.round(allGrades.reduce((sum: number, g: number) => sum + g, 0) / allGrades.length)
			: null
	);
	let quizAvgOverall = $derived(
		allScores.length > 0
			? Math.round(allScores.reduce((sum: number, s: number) => sum + s, 0) / allScores.length)
			: null
	);

	let gradedCount = $derived(allGrades.length);
	let totalPossible = $derived(totalAssignments * totalStudents);

	// ─── Helper Functions ───────────────────────────
	function gradeColor(value: number | null): string {
		if (value === null) return 'text-secondary';
		return value >= 75 ? 'text-success' : 'text-error';
	}
	function gradeBg(value: number | null): string {
		if (value === null) return '';
		return value >= 75 ? 'bg-[#e8f5e9]/60' : 'bg-[#ffebee]/60';
	}
	function avgBg(value: number | null): string {
		if (value === null) return '';
		return value >= 75 ? 'bg-[#e8f5e9]/40' : 'bg-[#ffebee]/40';
	}

	function calcStudentAssignAvg(student: any): number | null {
		const grades = student.assignments.filter((a: any) => a.grade !== null).map((a: any) => a.grade!);
		return grades.length > 0 ? Math.round(grades.reduce((s: number, v: number) => s + v, 0) / grades.length) : null;
	}
	function calcStudentQuizAvg(student: any): number | null {
		const scores = student.quizzes.filter((q: any) => q.score !== null).map((q: any) => q.score!);
		return scores.length > 0 ? Math.round(scores.reduce((s: number, v: number) => s + v, 0) / scores.length) : null;
	}

	function calcAssignAvg(assignId: string): number | null {
		const grades = (gradeData?.students ?? [])
			.map((s: any) => s.assignments.find((a: any) => a.id === assignId)?.grade)
			.filter((g: any): g is number => g !== null && g !== undefined);
		return grades.length > 0 ? Math.round(grades.reduce((s: number, v: number) => s + v, 0) / grades.length) : null;
	}
	function calcQuizAvg(quizId: string): number | null {
		const scores = (gradeData?.students ?? [])
			.map((s: any) => s.quizzes.find((q: any) => q.id === quizId)?.score)
			.filter((s: any): s is number => s !== null && s !== undefined);
		return scores.length > 0 ? Math.round(scores.reduce((sum: number, v: number) => sum + v, 0) / scores.length) : null;
	}
</script>

<div class="flex justify-between items-end mb-6 mt-4">
	<div>
		<h2 class="text-display-lg-mobile md:text-display-lg font-black text-on-surface uppercase tracking-tight">
			Rekap Nilai
		</h2>
		<p class="font-body-md text-secondary">Rekapitulasi nilai tugas dan kuis siswa per kelas.</p>
	</div>
</div>

{#if loadingClasses}
	<div class="bg-surface-container p-8 neo-border text-center flex flex-col items-center">
		<span class="material-symbols-outlined text-5xl text-secondary mb-3 animate-spin">hourglass_empty</span>
		<p class="font-bold text-secondary">Memuat daftar kelas...</p>
	</div>
{:else if errorMsg && !loadingGrades}
	<div class="bg-surface-container p-6 neo-border text-center flex flex-col items-center">
		<span class="material-symbols-outlined text-4xl text-error mb-2">error</span>
		<p class="font-bold text-error">{errorMsg}</p>
	</div>
{:else}
	<div class="max-w-md mb-8">
		<CustomSelect
			label="Pilih Kelas"
			options={classOptions}
			bind:value={selectedClassId}
			placeholder="-- Pilih kelas --"
		/>
	</div>

	{#if !selectedClassId}
		<div class="bg-surface-container p-16 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-7xl text-secondary mb-4">finance</span>
			<p class="font-bold text-secondary text-lg">Pilih kelas untuk melihat rekap nilai.</p>
			<p class="text-secondary text-sm mt-1">Data akan ditampilkan setelah Anda memilih kelas.</p>
		</div>
	{:else if loadingGrades}
		<div class="bg-surface-container p-8 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-5xl text-secondary mb-3 animate-spin">hourglass_empty</span>
			<p class="font-bold text-secondary">Memuat data nilai...</p>
		</div>
	{:else if gradeData}
		{@const gradedStudents = gradeData.students.filter(
			(s) => s.assignments.some((a) => a.grade !== null) || s.quizzes.some((q) => q.score !== null)
		)}

		<!-- ═══ Summary Stats ═══ -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
			<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-4">
				<div class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shrink-0">
					<span class="material-symbols-outlined text-primary">people</span>
				</div>
				<div class="min-w-0">
					<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Total Siswa</p>
					<p class="font-headline-md text-2xl font-bold">{totalStudents}</p>
					<p class="font-label-bold text-[11px] text-secondary">{gradedStudents.length} sudah dinilai</p>
				</div>
			</div>
			<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-4">
				<div class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shrink-0">
					<span class="material-symbols-outlined text-primary">assignment</span>
				</div>
				<div class="min-w-0">
					<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Total Tugas</p>
					<p class="font-headline-md text-2xl font-bold">{totalAssignments}</p>
					<p class="font-label-bold text-[11px] text-secondary">{gradedCount}/{totalPossible} ternilai</p>
				</div>
			</div>
			<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-4">
				<div class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shrink-0">
					<span class="material-symbols-outlined text-primary">quiz</span>
				</div>
				<div class="min-w-0">
					<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Total Kuis</p>
					<p class="font-headline-md text-2xl font-bold">{totalQuizzes}</p>
				</div>
			</div>
			<div class="bg-surface-container-lowest neo-border shadow-[3px_3px_0px_0px_rgba(26,28,28,1)] p-4 flex items-center gap-4">
				<div class="w-12 h-12 bg-primary-container neo-border flex items-center justify-center shrink-0">
					<span class="material-symbols-outlined text-primary">analytics</span>
				</div>
				<div class="min-w-0">
					<p class="font-label-bold text-[10px] uppercase text-secondary tracking-wider">Rata-rata Kelas</p>
					<p class="font-headline-md text-2xl font-bold {classAvg !== null ? (classAvg >= 75 ? 'text-success' : 'text-error') : 'text-secondary'}">
						{classAvg !== null ? classAvg : '-'}
					</p>
					<p class="font-label-bold text-[11px] text-secondary">
						{classAvg !== null ? (classAvg >= 75 ? '✅ Lulus' : '❌ Perlu Perbaikan') : 'Belum ada nilai'}
					</p>
				</div>
			</div>
		</div>

		<!-- ══════════════════════════════════════════ -->
		<!-- ═══  NILAI TUGAS  ═══ -->
		<!-- ══════════════════════════════════════════ -->
		<Card>
			<div class="flex items-center justify-between mb-4 border-b-2 border-on-surface pb-3">
				<h3 class="font-headline-md text-xl font-bold flex items-center gap-2">
					<span class="material-symbols-outlined">assignment</span>
					Nilai Tugas
				</h3>
				<div class="flex items-center gap-3">
					{#if totalAssignments > 0}
						<span class="font-label-bold text-xs text-secondary">{gradedCount}/{totalPossible} ternilai</span>
					{/if}
					{#if assignAvgOverall !== null}
						<span class="font-label-bold text-xs px-2 py-0.5 neo-border bg-primary-container/30">
							Rata²: <span class={gradeColor(assignAvgOverall)}>{assignAvgOverall}</span>
						</span>
					{/if}
				</div>
			</div>

			{#if totalAssignments === 0}
				<div class="py-10 text-center flex flex-col items-center">
					<span class="material-symbols-outlined text-4xl text-secondary mb-2">inbox</span>
					<p class="text-secondary italic">Belum ada tugas untuk kelas ini.</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full neo-border text-left border-collapse text-sm">
						<thead>
							<tr class="bg-surface-container border-b-2 border-on-surface font-label-bold text-on-surface">
								<th class="p-3 w-12 text-center border-r-2 border-on-surface">No</th>
								<th class="p-3 border-r-2 border-on-surface">Nama Siswa</th>
								{#each gradeData.assignments as a}
									<th class="p-3 text-center border-r-2 border-on-surface min-w-[80px] max-w-[130px]" title={a.title}>
										<div class="flex flex-col items-center">
											<span class="material-symbols-outlined text-xs text-secondary">assignment</span>
											<span class="truncate block max-w-[110px] text-[11px] leading-tight mt-0.5">{a.title}</span>
										</div>
									</th>
								{/each}
								<th class="p-3 text-center border-r-2 border-on-surface min-w-[70px] bg-primary-container/40">
									<div class="flex flex-col items-center">
										<span class="material-symbols-outlined text-xs">bar_chart</span>
										<span class="text-[11px] leading-tight mt-0.5">Rata²</span>
									</div>
								</th>
							</tr>
						</thead>
						<tbody class="divide-y-2 divide-on-surface">
							{#each gradeData.students as student, i}
								{@const avg = calcStudentAssignAvg(student)}
								<tr class="hover:bg-surface-container/50">
									<td class="p-3 text-center border-r-2 border-on-surface font-bold">{i + 1}</td>
									<td class="p-3 border-r-2 border-on-surface font-bold">
										<div class="flex items-center gap-2">
											<div class="w-7 h-7 bg-primary-container neo-border flex items-center justify-center shrink-0 text-xs font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
												{student.student.fullname.charAt(0).toUpperCase()}
											</div>
											<span>{student.student.fullname}</span>
										</div>
									</td>
									{#each student.assignments as ag}
										<td class="p-2 text-center border-r-2 border-on-surface font-label-bold {gradeColor(ag.grade)} {gradeBg(ag.grade)}">
											{#if ag.grade !== null}{ag.grade}{:else}<span class="text-secondary">-</span>{/if}
										</td>
									{/each}
									<td class="p-3 text-center border-r-2 border-on-surface font-headline-md text-base font-bold {gradeColor(avg)} bg-primary-container/20">
										{avg !== null ? avg : '-'}
									</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr class="bg-surface-container-high font-label-bold border-t-2 border-on-surface">
								<td class="p-3 text-center border-r-2 border-on-surface font-bold"></td>
								<td class="p-3 border-r-2 border-on-surface">
									<div class="flex items-center gap-2">
										<span class="material-symbols-outlined text-base">functions</span>
										Rata-rata
									</div>
								</td>
								{#each gradeData.assignments as a}
									{@const avgAssign = calcAssignAvg(a.id)}
									<td class="p-2 text-center border-r-2 border-on-surface font-label-bold {gradeColor(avgAssign)} {avgBg(avgAssign)}">
										{avgAssign !== null ? avgAssign : '-'}
									</td>
								{/each}
								<td class="p-3 text-center border-r-2 border-on-surface font-headline-md text-base font-bold {gradeColor(assignAvgOverall)} bg-primary-container/30">
									{assignAvgOverall !== null ? assignAvgOverall : '-'}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			{/if}
		</Card>

		<!-- ══════════════════════════════════════════ -->
		<!-- ═══  NILAI KUIS  ═══ -->
		<!-- ══════════════════════════════════════════ -->
		<div class="mt-8">
			<Card>
				<div class="flex items-center justify-between mb-4 border-b-2 border-on-surface pb-3">
					<h3 class="font-headline-md text-xl font-bold flex items-center gap-2">
						<span class="material-symbols-outlined">quiz</span>
						Nilai Kuis
					</h3>
					<div class="flex items-center gap-3">
						{#if totalQuizzes > 0}
							<span class="font-label-bold text-xs text-secondary">{totalQuizzes} kuis</span>
						{/if}
						{#if quizAvgOverall !== null}
							<span class="font-label-bold text-xs px-2 py-0.5 neo-border bg-primary-container/30">
								Rata²: <span class={gradeColor(quizAvgOverall)}>{quizAvgOverall}</span>
							</span>
						{/if}
					</div>
				</div>

				{#if totalQuizzes === 0}
					<div class="py-10 text-center flex flex-col items-center">
						<span class="material-symbols-outlined text-4xl text-secondary mb-2">inbox</span>
						<p class="text-secondary italic">Belum ada kuis untuk kelas ini.</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full neo-border text-left border-collapse text-sm">
							<thead>
								<tr class="bg-surface-container border-b-2 border-on-surface font-label-bold text-on-surface">
									<th class="p-3 w-12 text-center border-r-2 border-on-surface">No</th>
									<th class="p-3 border-r-2 border-on-surface">Nama Siswa</th>
									{#each gradeData.quizzes as q}
										<th class="p-3 text-center border-r-2 border-on-surface min-w-[80px] max-w-[130px]" title={q.title}>
											<div class="flex flex-col items-center">
												<span class="material-symbols-outlined text-xs text-secondary">quiz</span>
												<span class="truncate block max-w-[110px] text-[11px] leading-tight mt-0.5">{q.title}</span>
											</div>
										</th>
									{/each}
									<th class="p-3 text-center border-r-2 border-on-surface min-w-[70px] bg-primary-container/40">
										<div class="flex flex-col items-center">
											<span class="material-symbols-outlined text-xs">bar_chart</span>
											<span class="text-[11px] leading-tight mt-0.5">Rata²</span>
										</div>
									</th>
								</tr>
							</thead>
							<tbody class="divide-y-2 divide-on-surface">
								{#each gradeData.students as student, i}
									{@const avg = calcStudentQuizAvg(student)}
									<tr class="hover:bg-surface-container/50">
										<td class="p-3 text-center border-r-2 border-on-surface font-bold">{i + 1}</td>
										<td class="p-3 border-r-2 border-on-surface font-bold">
											<div class="flex items-center gap-2">
												<div class="w-7 h-7 bg-primary-container neo-border flex items-center justify-center shrink-0 text-xs font-bold shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
													{student.student.fullname.charAt(0).toUpperCase()}
												</div>
												<span>{student.student.fullname}</span>
											</div>
										</td>
										{#each student.quizzes as qg}
											<td class="p-2 text-center border-r-2 border-on-surface font-label-bold {gradeColor(qg.score)} {gradeBg(qg.score)}">
												{#if qg.score !== null}{qg.score}{:else}<span class="text-secondary">-</span>{/if}
											</td>
										{/each}
										<td class="p-3 text-center border-r-2 border-on-surface font-headline-md text-base font-bold {gradeColor(avg)} bg-primary-container/20">
											{avg !== null ? avg : '-'}
										</td>
									</tr>
								{/each}
							</tbody>
							<tfoot>
								<tr class="bg-surface-container-high font-label-bold border-t-2 border-on-surface">
									<td class="p-3 text-center border-r-2 border-on-surface font-bold"></td>
									<td class="p-3 border-r-2 border-on-surface">
										<div class="flex items-center gap-2">
											<span class="material-symbols-outlined text-base">functions</span>
											Rata-rata
										</div>
									</td>
									{#each gradeData.quizzes as q}
										{@const avgQuiz = calcQuizAvg(q.id)}
										<td class="p-2 text-center border-r-2 border-on-surface font-label-bold {gradeColor(avgQuiz)} {avgBg(avgQuiz)}">
											{avgQuiz !== null ? avgQuiz : '-'}
										</td>
									{/each}
									<td class="p-3 text-center border-r-2 border-on-surface font-headline-md text-base font-bold {gradeColor(quizAvgOverall)} bg-primary-container/30">
										{quizAvgOverall !== null ? quizAvgOverall : '-'}
									</td>
								</tr>
							</tfoot>
						</table>
					</div>
				{/if}
			</Card>
		</div>

	{:else if selectedClassId}
		<div class="bg-surface-container p-16 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-7xl text-secondary mb-4">analytics</span>
			<p class="font-bold text-secondary text-lg">Data nilai tidak tersedia untuk kelas ini.</p>
			<p class="text-secondary text-sm mt-2">Belum ada tugas atau kuis yang dipublikasikan ke kelas ini.</p>
		</div>
	{/if}
{/if}
