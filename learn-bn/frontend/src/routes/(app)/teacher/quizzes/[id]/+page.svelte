<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { lmsStore, type QuizStudentSubmissionItem } from '$lib/features/lms/lms-store.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let quizId = $derived($page.params.id as string);

	let classesMap: Record<string, string> = $state({});
	let submissions = $state<QuizStudentSubmissionItem[]>([]);
	let loadingSubmissions = $state(true);
	let activeClassId = $state<string>('all');
	let showDeleteModal = $state(false);
	let deleting = $state(false);
	let errorMsg = $state('');

	$effect(() => {
		lmsStore.getTeacherClasses().then((classes) => {
			classesMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));
		});

		async function fetchSubmissions() {
			loadingSubmissions = true;
			try {
				submissions = await lmsStore.getQuizSubmissions(quizId);
			} catch (err: any) {
				console.error('Gagal memuat hasil kuis:', err);
			} finally {
				loadingSubmissions = false;
			}
		}
		fetchSubmissions();
	});

	let availableClasses = $derived(() => {
		const map = new Map<string, string>();
		for (const item of submissions) {
			if (item.class?.id && item.class?.name) {
				map.set(item.class.id, item.class.name);
			}
		}
		return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
	});

	let filteredSubmissions = $derived(
		activeClassId === 'all'
			? submissions
			: submissions.filter((s) => s.class?.id === activeClassId)
	);

	let completedSubmissions = $derived(filteredSubmissions.filter((s) => s.submission?.finishedAt != null));
	let totalStudents = $derived(filteredSubmissions.length);
	let completedCount = $derived(completedSubmissions.length);
	let averageScore = $derived(() => {
		if (completedCount === 0) return 0;
		const sum = completedSubmissions.reduce((acc, s) => acc + (s.submission?.score || 0), 0);
		return Math.round((sum / completedCount) * 10) / 10;
	});

	async function handleDelete() {
		deleting = true;
		errorMsg = '';
		try {
			await lmsStore.deleteQuiz(quizId);
			goto('/teacher/quizzes');
		} catch (err: any) {
			errorMsg = err.message || 'Gagal menghapus kuis';
			deleting = false;
		}
	}
</script>

<svelte:head>
	<title>Detail Kuis - Akademik-BN</title>
</svelte:head>

{#await lmsStore.getQuiz(quizId)}
	<div class="bg-surface-container-lowest neo-border p-12 text-center w-full">
		<span class="material-symbols-outlined text-4xl text-secondary mb-2">hourglass</span>
		<p class="font-bold text-secondary">Memuat kuis...</p>
	</div>
{:then quiz}
	{#if !quiz}
		<div class="bg-surface-container-lowest neo-border p-12 text-center w-full">
			<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
			<h2 class="font-headline-md text-2xl font-black mb-2">Kuis Tidak Ditemukan</h2>
			<a href="/teacher/quizzes" class="mt-4 inline-block">
				<Button variant="outline">Kembali ke Daftar Kuis</Button>
			</a>
		</div>
	{:else}
		<div class="w-full flex flex-col gap-6">
			<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<div class="flex items-center gap-3">
						<h2 class="font-display-lg text-3xl font-black tracking-tight">{quiz.title}</h2>
						{#if quiz.status === 'Published'}
							<Badge variant="success">Published</Badge>
						{:else}
							<Badge variant="warning">Draft</Badge>
						{/if}
					</div>
					<div class="mt-2 flex flex-wrap items-center gap-4 font-body-md text-secondary">
						<span class="flex items-center gap-1">
							<span class="material-symbols-outlined text-sm">school</span>
							{quiz.classes?.map((c) => c.class?.name || classesMap[c.classId]).filter(Boolean).join(', ') || classesMap[quiz.classId || ''] || 'Kelas'}
						</span>
						<span class="flex items-center gap-1">
							<span class="material-symbols-outlined text-sm">timer</span>
							{quiz.timeLimit ? `${quiz.timeLimit} menit` : 'Tanpa batas waktu'}
						</span>
						<span class="flex items-center gap-1">
							<span class="material-symbols-outlined text-sm">help</span>
							{quiz.questions?.length ?? quiz._count?.questions ?? 0} soal
						</span>
					</div>
				</div>
				<div class="flex items-center gap-2 shrink-0">
					<a href={`/teacher/quizzes/${quiz.id}/edit`}>
						<Button variant="primary">
							<span class="material-symbols-outlined text-sm">edit</span>
							Edit
						</Button>
					</a>
					<Button variant="error" onclick={() => (showDeleteModal = true)}>
						<span class="material-symbols-outlined text-sm">delete</span>
						Hapus
					</Button>
				</div>
			</div>

			<!-- System Tab per Kelas (Sama seperti detail kelas) -->
			{#if availableClasses().length > 1}
				<nav class="flex flex-wrap gap-2 mt-2">
					<button
						type="button"
						onclick={() => (activeClassId = 'all')}
						class="inline-flex items-center gap-2 px-4 py-2 font-label-bold text-sm uppercase transition-all duration-100 cursor-pointer {activeClassId === 'all'
							? 'bg-primary-container neo-border neo-shadow'
							: 'bg-surface-container-lowest border-2 border-on-surface hover:bg-surface-container'}"
					>
						<span class="material-symbols-outlined text-sm">groups</span>
						Semua Kelas ({submissions.length})
					</button>

					{#each availableClasses() as cls}
						{@const classSubCount = submissions.filter((s) => s.class?.id === cls.id).length}
						<button
							type="button"
							onclick={() => (activeClassId = cls.id)}
							class="inline-flex items-center gap-2 px-4 py-2 font-label-bold text-sm uppercase transition-all duration-100 cursor-pointer {activeClassId === cls.id
								? 'bg-primary-container neo-border neo-shadow'
								: 'bg-surface-container-lowest border-2 border-on-surface hover:bg-surface-container'}"
						>
							<span class="material-symbols-outlined text-sm">school</span>
							{cls.name} ({classSubCount})
						</button>
					{/each}
				</nav>
			{/if}

			<!-- Ringkasan Statistik Pengerjaan -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div class="bg-surface-container-lowest neo-border p-4 flex items-center gap-3">
					<div class="w-10 h-10 bg-primary/20 neo-border flex items-center justify-center">
						<span class="material-symbols-outlined text-primary">groups</span>
					</div>
					<div>
						<p class="font-label-bold text-xs text-secondary uppercase">Total Siswa</p>
						<p class="font-display-lg text-xl font-black">{totalStudents} Siswa</p>
					</div>
				</div>

				<div class="bg-surface-container-lowest neo-border p-4 flex items-center gap-3">
					<div class="w-10 h-10 bg-success/20 neo-border flex items-center justify-center">
						<span class="material-symbols-outlined text-success">check_circle</span>
					</div>
					<div>
						<p class="font-label-bold text-xs text-secondary uppercase">Sudah Mengerjakan</p>
						<p class="font-display-lg text-xl font-black">{completedCount} / {totalStudents}</p>
					</div>
				</div>

				<div class="bg-surface-container-lowest neo-border p-4 flex items-center gap-3">
					<div class="w-10 h-10 bg-tertiary/20 neo-border flex items-center justify-center">
						<span class="material-symbols-outlined text-tertiary">analytics</span>
					</div>
					<div>
						<p class="font-label-bold text-xs text-secondary uppercase">Rata-rata Nilai</p>
						<p class="font-display-lg text-xl font-black">{completedCount > 0 ? averageScore() : '-'}</p>
					</div>
				</div>
			</div>

			<!-- Tabel Monitoring Pengerjaan & Nilai Siswa -->
			<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
				<h3 class="font-headline-md text-lg font-bold mb-4 flex items-center gap-2">
					<span class="material-symbols-outlined">how_to_reg</span>
					Daftar Pengerjaan Siswa
					{#if activeClassId !== 'all'}
						<span class="text-secondary font-normal text-sm">
							({availableClasses().find((c) => c.id === activeClassId)?.name || ''})
						</span>
					{/if}
				</h3>

				{#if loadingSubmissions}
					<div class="py-8 text-center text-secondary font-bold">
						<span class="material-symbols-outlined text-3xl animate-spin mb-2">hourglass_empty</span>
						<p>Memuat data pengerjaan siswa...</p>
					</div>
				{:else if filteredSubmissions.length === 0}
					<div class="py-8 text-center text-secondary font-bold">
						<span class="material-symbols-outlined text-4xl mb-2">info</span>
						<p>Belum ada data siswa untuk filter kelas ini.</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full neo-border text-left border-collapse text-sm">
							<thead>
								<tr class="bg-surface-container border-b-2 border-on-surface font-label-bold text-on-surface">
									<th class="p-3 w-12 text-center border-r-2 border-on-surface">No</th>
									<th class="p-3 border-r-2 border-on-surface">Nama Siswa</th>
									<th class="p-3 border-r-2 border-on-surface">NIS</th>
									{#if activeClassId === 'all' && availableClasses().length > 1}
										<th class="p-3 border-r-2 border-on-surface">Kelas</th>
									{/if}
									<th class="p-3 border-r-2 border-on-surface">Status Pengerjaan</th>
									<th class="p-3 border-r-2 border-on-surface">Waktu Selesai</th>
									<th class="p-3 text-left">Nilai Kuis</th>
								</tr>
							</thead>
							<tbody class="divide-y-2 divide-on-surface">
								{#each filteredSubmissions as item, idx}
									<tr class="hover:bg-surface-container/50">
										<td class="p-3 text-center border-r-2 border-on-surface font-bold">{idx + 1}</td>
										<td class="p-3 border-r-2 border-on-surface font-bold">
											<div class="flex items-center gap-2">
												<span class="material-symbols-outlined text-secondary text-base">person</span>
												<span>{item.student.fullname}</span>
											</div>
										</td>
										<td class="p-3 border-r-2 border-on-surface font-mono">{item.student.nis || '-'}</td>
										{#if activeClassId === 'all' && availableClasses().length > 1}
											<td class="p-3 border-r-2 border-on-surface font-label-bold text-xs uppercase">
												{item.class?.name || '-'}
											</td>
										{/if}
										<td class="p-3 border-r-2 border-on-surface">
											{#if item.submission?.finishedAt}
												<Badge variant="success">Selesai</Badge>
											{:else if item.submission?.startedAt}
												<Badge variant="primary">Sedang Dikerjakan</Badge>
											{:else}
												<Badge variant="outline">Belum Dikerjakan</Badge>
											{/if}
										</td>
										<td class="p-3 border-r-2 border-on-surface text-xs text-secondary font-mono">
											{#if item.submission?.finishedAt}
												{new Date(item.submission.finishedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
											{:else}
												-
											{/if}
										</td>
										<td class="p-3 text-left font-black text-base">
											{#if item.submission?.score !== null && item.submission?.score !== undefined}
												<span class="px-2 py-1 bg-primary/10 neo-border text-primary inline-block">
													{item.submission.score} / 100
												</span>
											{:else}
												<span class="text-secondary font-normal">-</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<!-- Daftar Soal-soal Kuis -->
			{#if quiz.questions && quiz.questions.length > 0}
				<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
					<h3 class="font-headline-md text-lg font-bold mb-4 flex items-center gap-2">
						<span class="material-symbols-outlined">quiz</span>
						Daftar Soal Kuis
					</h3>
					<div class="flex flex-col gap-4">
						{#each quiz.questions as q, i}
							<div class="neo-border bg-surface p-4">
								<p class="font-label-bold text-sm mb-2">Soal {i + 1}</p>
								<div class="mb-3 text-sm">{@html q.question}</div>
								<ul class="space-y-1">
									{#each q.options as opt, oi}
										<li class="flex items-center gap-2 text-sm {oi === q.correctOption ? 'bg-success/20 p-2 neo-border font-bold' : ''}">
											<span class="font-label-bold">{String.fromCharCode(65 + oi)}.</span>
											<span>{opt}</span>
											{#if oi === q.correctOption}
												<Badge variant="success">Jawaban Benar</Badge>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Modal Konfirmasi Hapus -->
		{#if showDeleteModal}
			<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
				<div class="bg-surface-container-lowest neo-border max-w-md w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
					<h3 class="font-headline-md text-xl font-bold text-error flex items-center gap-2 mb-3">
						<span class="material-symbols-outlined">warning</span>
						Hapus Kuis?
					</h3>
					<p class="font-body-md mb-6">
						Apakah Anda yakin ingin menghapus kuis <strong>"{quiz.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
					</p>

					{#if errorMsg}
						<p class="text-error font-bold text-sm mb-4">{errorMsg}</p>
					{/if}

					<div class="flex justify-end gap-3">
						<Button variant="outline" disabled={deleting} onclick={() => (showDeleteModal = false)}>
							Batal
						</Button>
						<Button variant="error" disabled={deleting} onclick={handleDelete}>
							{deleting ? 'Menghapus...' : 'Hapus Kuis'}
						</Button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
{:catch error}
	<div class="bg-surface-container-lowest neo-border p-12 text-center max-w-4xl mx-auto mt-8">
		<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
		<p class="font-bold text-error">{error.message}</p>
	</div>
{/await}
