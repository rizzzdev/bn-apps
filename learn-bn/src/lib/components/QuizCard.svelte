<script lang="ts">
	import type { Quiz, QuizStudentSubmissionItem } from '$lib/features/lms/lms-store.svelte';
	import Badge from '$lib/components/Badge.svelte';

	export interface QuizWithSubmission extends Quiz {
		className?: string;
		submission?: any;
	}

	let {
		quiz,
		href,
		showStatus = false,
		role = 'student'
	}: {
		quiz: QuizWithSubmission;
		href?: string;
		showStatus?: boolean;
		role?: 'student' | 'teacher';
	} = $props();

	let subjectName = $derived(
		quiz.teacher?.subjectTeachers && quiz.teacher.subjectTeachers.length > 0
			? quiz.teacher.subjectTeachers.map((st) => st.subject?.name).filter(Boolean).join(', ')
			: 'Umum'
	);

	let teacherName = $derived(
		(() => {
			if (!quiz.teacher) return 'Guru';
			const prefix = quiz.teacher.prefixTitle?.trim() ? `${quiz.teacher.prefixTitle.trim()} ` : '';
			const suffix = quiz.teacher.suffixTitle?.trim() ? `, ${quiz.teacher.suffixTitle.trim()}` : '';
			return `${prefix}${quiz.teacher.fullname.trim()}${suffix}`;
		})()
	);

	let targetClasses = $derived(
		quiz.classes && quiz.classes.length > 0
			? quiz.classes.map((c) => c.class?.name).filter(Boolean).join(', ')
			: quiz.className || 'Kelas'
	);

	let defaultHref = $derived(
		href || (role === 'teacher' ? `/teacher/quizzes/${quiz.id}` : `/student/quizzes/${quiz.id}`)
	);
</script>

<a href={defaultHref} class="block">
	<article
		class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] transition-all duration-200 h-full"
	>
		<div class="border-b-2 border-on-surface bg-surface-container p-4 flex flex-wrap items-center justify-between gap-2">
			<!-- Format Badge: 1. Jenis, 2. Nama Mapel, 3. Kelas, 4. Counter -->
			<div class="flex items-center gap-2 flex-wrap">
				<!-- 1. Jenis -->
				<Badge variant="primary" icon="quiz" text="Kuis" />

				<!-- 2. Nama Mapel -->
				<Badge variant="neutral" icon="book" text={subjectName} />

				<!-- 3. Kelas -->
				<Badge variant="neutral" icon="school" text={targetClasses} />

				<!-- 4. Counter -->
				{#if role === 'teacher'}
					<Badge
						variant="info"
						icon="check_circle"
						text={`${quiz.quizStats?.completedCount ?? 0}/${quiz.quizStats?.totalStudents ?? 0} dikerjakan`}
					/>
				{:else}
					<!-- Student View -->
					{#if quiz.submission?.finishedAt}
						<Badge variant="success" icon="check_circle" text="Sudah Dikerjakan" />
					{:else if quiz.submission?.startedAt}
						<Badge variant="primary" icon="pending" text="Sedang Dikerjakan" />
					{:else}
						<Badge variant="warning" icon="pending_actions" text="Belum Dikerjakan" />
					{/if}
				{/if}
			</div>

			{#if showStatus && role === 'teacher'}
				<div>
					{#if quiz.status === 'Draft'}
						<Badge variant="warning" icon="drafts" text="Draft" />
					{:else}
						<Badge variant="success" icon="check_circle" text="Published" />
					{/if}
				</div>
			{/if}
		</div>

		<div class="p-6">
			<h3 class="font-headline-md text-xl font-bold text-on-surface mb-2">{quiz.title}</h3>

			<!-- Guru beserta Gelar -->
			<div class="flex items-center gap-2 text-sm font-label-bold text-secondary mb-4 bg-surface-container/60 p-2.5 neo-border">
				<div class="w-7 h-7 bg-white neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-base text-on-surface">person</span>
				</div>
				<span class="truncate">Guru: {teacherName}</span>
			</div>

			<div class="flex flex-wrap items-center gap-4 text-xs font-label-bold text-secondary mb-2">
				<span class="flex items-center gap-1 bg-surface-container px-3 py-1.5 neo-border text-on-surface">
					<span class="material-symbols-outlined text-sm text-primary font-bold">help</span>
					{quiz.questions?.length ?? quiz._count?.questions ?? 0} Soal
				</span>
				<span class="flex items-center gap-1 bg-surface-container px-3 py-1.5 neo-border text-on-surface">
					<span class="material-symbols-outlined text-sm text-secondary font-bold">timer</span>
					{quiz.timeLimit ? `${quiz.timeLimit} Menit` : 'Tanpa batas waktu'}
				</span>
			</div>

			<div class="flex items-center justify-between text-xs font-label-bold text-secondary border-t-2 border-on-surface/20 pt-3 mt-4">
				<div class="flex items-center gap-1">
					<span class="material-symbols-outlined text-sm">calendar_today</span>
					<span>{quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
				</div>

				{#if role === 'student' && quiz.submission?.score !== null && quiz.submission?.score !== undefined}
					<div class="flex items-center gap-1 text-success font-black text-sm">
						<span class="material-symbols-outlined text-sm">grade</span>
						<span>Nilai: {quiz.submission.score} / 100</span>
					</div>
				{/if}
			</div>
		</div>
	</article>
</a>
