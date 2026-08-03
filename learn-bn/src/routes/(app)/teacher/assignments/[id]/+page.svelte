<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { lmsStore, type Assignment, type AssignmentSubmission } from '$lib/features/lms/lms-store.svelte';
	import { getAttachmentUrl } from '$lib/utils/attachment';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let assignmentId = $derived($page.params.id as string);

	let assignment = $state<Assignment | null>(null);
	let submissions = $state<AssignmentSubmission[]>([]);
	let classesMap = $state<Record<string, string>>({});
	let loading = $state(true);
	let errorMsg = $state('');

	// Active tab state
	let activeClassId = $state<string>('all');

	// Delete state
	let isDeleting = $state(false);
	let showDeleteModal = $state(false);

	// Individual Grade Modal State
	let gradingSubmission = $state<AssignmentSubmission | null>(null);
	let inputGrade = $state<number>(0);
	let inputFeedback = $state<string>('');
	let isGrading = $state(false);
	let gradeError = $state('');

	async function loadData() {
		loading = true;
		errorMsg = '';
		try {
			const [fetchedAssignment, fetchedSubmissions, fetchedClasses] = await Promise.all([
				lmsStore.getAssignment(assignmentId),
				lmsStore.getSubmissions(assignmentId),
				lmsStore.getTeacherClasses()
			]);
			assignment = fetchedAssignment;
			submissions = fetchedSubmissions;
			classesMap = Object.fromEntries(fetchedClasses.map((c) => [c.id, c.name]));
		} catch (err: any) {
			errorMsg = err.message || 'Gagal memuat detail tugas';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadData();
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

	let submittedList = $derived(filteredSubmissions.filter((s) => s.createdAt || s.fileUrl || s.content || s.submission));
	let totalStudents = $derived(filteredSubmissions.length);
	let submittedCount = $derived(submittedList.length);
	let gradedCount = $derived(filteredSubmissions.filter((s) => s.grade !== null && s.grade !== undefined).length);

	let averageScore = $derived(() => {
		const gradedItems = filteredSubmissions.filter((s) => s.grade !== null && s.grade !== undefined);
		if (gradedItems.length === 0) return '-';
		const sum = gradedItems.reduce((acc, s) => acc + (s.grade || 0), 0);
		return Math.round((sum / gradedItems.length) * 10) / 10;
	});

	async function handleDelete() {
		if (!assignment) return;
		isDeleting = true;
		try {
			await lmsStore.deleteAssignment(assignment.id);
			goto('/teacher/assignments');
		} catch (err: any) {
			alert(err.message || 'Gagal menghapus tugas');
		} finally {
			isDeleting = false;
			showDeleteModal = false;
		}
	}

	function openGradingModal(sub: AssignmentSubmission) {
		gradingSubmission = sub;
		inputGrade = sub.grade ?? 0;
		inputFeedback = sub.feedback ?? '';
		gradeError = '';
	}

	async function saveIndividualGrade() {
		if (!gradingSubmission || !gradingSubmission.id) return;
		if (inputGrade < 0 || inputGrade > 100) {
			gradeError = 'Nilai harus antara 0 dan 100';
			return;
		}
		isGrading = true;
		gradeError = '';
		try {
			const updated = await lmsStore.gradeSubmission(gradingSubmission.id, {
				grade: Number(inputGrade),
				feedback: inputFeedback.trim() || undefined
			});
			submissions = submissions.map((s) => (s.id === updated.id ? { ...s, grade: updated.grade, feedback: updated.feedback } : s));
			gradingSubmission = null;
		} catch (err: any) {
			gradeError = err.message || 'Gagal menyimpan nilai';
		} finally {
			isGrading = false;
		}
	}

	function formatDate(dateStr?: string | null) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{assignment ? assignment.title : 'Detail Tugas'} - Akademik-BN</title>
</svelte:head>

{#if loading}
	<div class="bg-surface-container-lowest neo-border p-12 text-center w-full">
		<span class="material-symbols-outlined text-4xl text-secondary mb-2 animate-spin">hourglass_empty</span>
		<p class="font-bold text-secondary">Memuat detail tugas...</p>
	</div>
{:else if errorMsg || !assignment}
	<div class="bg-surface-container-lowest neo-border p-12 text-center w-full">
		<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
		<h2 class="font-headline-md text-2xl font-black mb-2">{errorMsg || 'Tugas Tidak Ditemukan'}</h2>
		<a href="/teacher/assignments" class="mt-4 inline-block">
			<Button variant="outline">Kembali ke Daftar Tugas</Button>
		</a>
	</div>
{:else}
	{@const subjectName = assignment.teacher?.subjectTeachers?.length ? assignment.teacher.subjectTeachers.map((st: any) => st.subject?.name).filter(Boolean).join(', ') : 'Umum'}
	{@const teacherName = assignment.teacher ? `${assignment.teacher.prefixTitle?.trim() ? assignment.teacher.prefixTitle.trim() + ' ' : ''}${assignment.teacher.fullname.trim()}${assignment.teacher.suffixTitle?.trim() ? ', ' + assignment.teacher.suffixTitle.trim() : ''}` : 'Guru'}
	{@const targetClassesText = assignment.classes?.map((c) => c.class?.name || classesMap[c.classId]).filter(Boolean).join(', ') || classesMap[assignment.classId || ''] || 'Kelas'}

	<div class="w-full flex flex-col gap-6">
		<!-- Header & Action Buttons -->
		<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
			<div>
				<div class="flex items-center gap-3">
					<h2 class="font-display-lg text-3xl font-black tracking-tight">{assignment.title}</h2>
					{#if assignment.status === 'Published'}
						<Badge variant="success">Published</Badge>
					{:else}
						<Badge variant="warning">Draft</Badge>
					{/if}
				</div>
				<div class="mt-2 flex flex-wrap items-center gap-4 font-body-md text-secondary">
					<span class="flex items-center gap-1">
						<span class="material-symbols-outlined text-sm">school</span>
						{targetClassesText}
					</span>
					<span class="flex items-center gap-1">
						<span class="material-symbols-outlined text-sm">book</span>
						{subjectName}
					</span>
					<span class="flex items-center gap-1 text-error font-bold">
						<span class="material-symbols-outlined text-sm">event</span>
						Deadline: {formatDate(assignment.deadline)}
					</span>
				</div>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<a href={`/teacher/assignments/${assignment.id}/edit`}>
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

		<!-- System Tab per Kelas (Identik dengan detail kuis) -->
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

		<!-- Ringkasan Statistik Pengumpulan (Identik dengan detail kuis 3-grid) -->
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
					<p class="font-label-bold text-xs text-secondary uppercase">Sudah Mengumpulkan</p>
					<p class="font-display-lg text-xl font-black">{submittedCount} / {totalStudents}</p>
				</div>
			</div>

			<div class="bg-surface-container-lowest neo-border p-4 flex items-center gap-3">
				<div class="w-10 h-10 bg-tertiary/20 neo-border flex items-center justify-center">
					<span class="material-symbols-outlined text-tertiary">analytics</span>
				</div>
				<div>
					<p class="font-label-bold text-xs text-secondary uppercase">Rata-rata Nilai</p>
					<p class="font-display-lg text-xl font-black">{averageScore()}</p>
				</div>
			</div>
		</div>

		<!-- Tabel Monitoring Pengumpulan & Nilai Siswa -->
		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
			<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
				<h3 class="font-headline-md text-lg font-bold flex items-center gap-2">
					<span class="material-symbols-outlined">how_to_reg</span>
					Daftar Pengumpulan Siswa
					{#if activeClassId !== 'all'}
						<span class="text-secondary font-normal text-sm">
							({availableClasses().find((c) => c.id === activeClassId)?.name || ''})
						</span>
					{/if}
				</h3>

				{#if submittedCount > 0}
					<a href={`/teacher/assignments/${assignment.id}/grade`}>
						<Button variant="primary" size="sm">
							<span class="material-symbols-outlined text-sm">edit_note</span>
							Koreksi Massal
						</Button>
					</a>
				{/if}
			</div>

			{#if filteredSubmissions.length === 0}
				<div class="py-8 text-center text-secondary font-bold bg-surface-container neo-border">
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
								<th class="p-3 border-r-2 border-on-surface">Status Pengumpulan</th>
								<th class="p-3 border-r-2 border-on-surface">Waktu Pengumpulan</th>
								<th class="p-3 border-r-2 border-on-surface text-left">Nilai</th>
								<th class="p-3 text-left">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y-2 divide-on-surface">
							{#each filteredSubmissions as sub, idx}
								<tr class="hover:bg-surface-container/50">
									<td class="p-3 text-center border-r-2 border-on-surface font-bold">{idx + 1}</td>
									<td class="p-3 border-r-2 border-on-surface font-bold">
										<div class="flex items-center gap-2">
											{#if sub.student?.pictureUrl}
												<img src={sub.student.pictureUrl} alt={sub.student.fullname} class="w-7 h-7 rounded-full neo-border object-cover" />
											{:else}
												<span class="material-symbols-outlined text-secondary text-base">person</span>
											{/if}
											<span>{sub.student?.fullname}</span>
										</div>
									</td>
									<td class="p-3 border-r-2 border-on-surface font-mono text-xs">{sub.student?.nis || '-'}</td>
									{#if activeClassId === 'all' && availableClasses().length > 1}
										<td class="p-3 border-r-2 border-on-surface font-label-bold text-xs uppercase">
											{sub.class?.name || '-'}
										</td>
									{/if}
									<td class="p-3 border-r-2 border-on-surface">
										{#if sub.createdAt || sub.fileUrl || sub.content || sub.submission}
											{#if sub.grade !== null && sub.grade !== undefined}
												<Badge variant="success">Sudah Dinilai</Badge>
											{:else}
												<Badge variant="primary">Menunggu Penilaian</Badge>
											{/if}
										{:else}
											<Badge variant="outline">Belum Mengumpulkan</Badge>
										{/if}
									</td>
									<td class="p-3 border-r-2 border-on-surface text-xs text-secondary font-mono">
										{formatDate(sub.createdAt)}
									</td>
									<td class="p-3 border-r-2 border-on-surface text-left font-black text-base">
										{#if sub.grade !== null && sub.grade !== undefined}
											<span class="px-2 py-1 bg-primary/10 neo-border text-primary inline-block">
												{sub.grade} / 100
											</span>
										{:else}
											<span class="text-secondary font-normal">-</span>
										{/if}
									</td>
									<td class="p-3 text-left">
										{#if sub.createdAt || sub.fileUrl || sub.content || sub.submission}
											<Button size="sm" variant="outline" onclick={() => openGradingModal(sub)}>
												<span class="material-symbols-outlined text-xs">rate_review</span>
												Koreksi
											</Button>
										{:else}
											<span class="text-xs text-secondary font-normal">-</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Detail Deskripsi & Lampiran Guru (Diletakkan di Paling Bawah) -->
		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
			<h3 class="font-headline-md text-lg font-bold mb-3 flex items-center gap-2">
				<span class="material-symbols-outlined">description</span>
				Deskripsi & Instruksi Tugas
			</h3>

			<!-- Bar Profil Guru -->
			<div class="flex items-center gap-2 text-sm font-label-bold text-secondary mb-4 bg-surface-container/60 p-2.5 neo-border">
				<div class="w-7 h-7 bg-white neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-base text-on-surface">person</span>
				</div>
				<span class="truncate">Guru: {teacherName}</span>
			</div>

			<div class="font-body-md text-on-surface leading-relaxed mb-4 p-4 bg-surface-container neo-border">
				{@html assignment.description}
			</div>

			{#if assignment.attachments && assignment.attachments.length > 0}
				<div class="border-t-2 border-on-surface/20 pt-4 mt-4">
					<h4 class="font-label-bold text-sm font-bold mb-3 flex items-center gap-2">
						<span class="material-symbols-outlined">attach_file</span>
						Lampiran File Guru ({assignment.attachments.length})
					</h4>
					<div class="flex flex-col gap-2">
						{#each assignment.attachments as att}
							<a
								href={getAttachmentUrl(att.fileUrl)}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-3 p-3 neo-border bg-surface-container hover:bg-primary-container transition-colors"
							>
								<span class="material-symbols-outlined text-secondary">description</span>
								<span class="font-label-bold text-sm">{att.fileName}</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Modal Hapus Assignment -->
	{#if showDeleteModal}
		<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div class="bg-surface-container-lowest neo-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full flex flex-col gap-4">
				<h4 class="font-headline-md text-xl font-bold text-error flex items-center gap-2">
					<span class="material-symbols-outlined">warning</span>
					Hapus Tugas?
				</h4>
				<p class="font-body-md">Apakah Anda yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.</p>
				<div class="flex justify-end items-center gap-3 mt-4">
					<Button variant="outline" disabled={isDeleting} onclick={() => (showDeleteModal = false)}>
						Batal
					</Button>
					<Button variant="error" disabled={isDeleting} onclick={handleDelete}>
						{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Modal Koreksi Individu -->
	{#if gradingSubmission}
		<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div class="bg-surface-container-lowest neo-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-lg w-full flex flex-col gap-4">
				<div class="flex items-center justify-between border-b-2 border-on-surface pb-3">
					<h4 class="font-headline-md text-xl font-bold flex items-center gap-2">
						<span class="material-symbols-outlined text-primary">rate_review</span>
						Koreksi Tugas Murid
					</h4>
					<button onclick={() => (gradingSubmission = null)} class="text-secondary hover:text-on-surface cursor-pointer">
						<span class="material-symbols-outlined">close</span>
					</button>
				</div>

				<div class="bg-surface-container p-3 neo-border text-sm">
					<p class="font-bold">Murid: {gradingSubmission.student?.fullname || gradingSubmission.studentId}</p>
					<p class="text-xs text-secondary mt-1">Dikumpulkan pada: {formatDate(gradingSubmission.createdAt)}</p>
				</div>

				{#if gradingSubmission.fileUrl}
					<div class="flex items-center gap-2">
						<span class="font-bold text-sm">File Pengumpulan:</span>
						<a
							href={getAttachmentUrl(gradingSubmission.fileUrl)}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1 px-3 py-1 bg-primary-container neo-border text-xs font-bold"
						>
							<span class="material-symbols-outlined text-xs">download</span>
							{gradingSubmission.fileName || 'Download File'}
						</a>
					</div>
				{/if}

				{#if gradingSubmission.content}
					<div class="flex flex-col gap-1">
						<span class="font-bold text-sm">Catatan / Jawaban Murid:</span>
						<div class="p-3 bg-surface-container neo-border text-sm max-h-32 overflow-y-auto">
							{gradingSubmission.content}
						</div>
					</div>
				{/if}

				<div class="flex flex-col gap-1 mt-2">
					<label for="gradeInput" class="font-label-bold text-sm">Nilai (0 - 100) <span class="text-error">*</span></label>
					<input
						id="gradeInput"
						type="number"
						min="0"
						max="100"
						bind:value={inputGrade}
						class="w-full bg-surface-container-lowest neo-border py-2 px-3 font-bold text-lg"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label for="feedbackInput" class="font-label-bold text-sm">Masukan / Feedback untuk Murid</label>
					<textarea
						id="feedbackInput"
						bind:value={inputFeedback}
						placeholder="Tulis masukan atau catatan perbaikan untuk murid..."
						rows="3"
						class="w-full bg-surface-container-lowest neo-border p-3 text-sm font-body-md"
					></textarea>
				</div>

				{#if gradeError}
					<p class="text-error font-bold text-sm">{gradeError}</p>
				{/if}

				<div class="flex justify-end items-center gap-3 mt-2">
					<Button variant="outline" disabled={isGrading} onclick={() => (gradingSubmission = null)}>
						Batal
					</Button>
					<Button variant="primary" disabled={isGrading} onclick={saveIndividualGrade}>
						{isGrading ? 'Menyimpan...' : 'Simpan Nilai'}
					</Button>
				</div>
			</div>
		</div>
	{/if}
{/if}
