<script lang="ts">
	import type { Assignment, AssignmentSubmission } from '$lib/features/lms/lms-store.svelte';
	import Badge from '$lib/components/Badge.svelte';

	export interface AssignmentWithSubmission extends Assignment {
		className?: string;
		submission?: AssignmentSubmission | null;
		submissionStats?: {
			submittedCount: number;
			totalStudents: number;
		};
	}

	let {
		assignment,
		href,
		showStatus = false,
		role = 'student',
		className = ''
	}: {
		assignment: AssignmentWithSubmission;
		href?: string;
		showStatus?: boolean;
		role?: 'student' | 'teacher';
		className?: string;
	} = $props();

	let subjectName = $derived(
		assignment.teacher?.subjectTeachers && assignment.teacher.subjectTeachers.length > 0
			? assignment.teacher.subjectTeachers.map((st) => st.subject?.name).filter(Boolean).join(', ')
			: 'Umum'
	);

	let teacherName = $derived(
		(() => {
			if (!assignment.teacher) return '';
			const prefix = assignment.teacher.prefixTitle?.trim() ? `${assignment.teacher.prefixTitle.trim()} ` : '';
			const suffix = assignment.teacher.suffixTitle?.trim() ? `, ${assignment.teacher.suffixTitle.trim()}` : '';
			return `${prefix}${assignment.teacher.fullname.trim()}${suffix}`;
		})()
	);

	let targetClassName = $derived(
		assignment.classes && assignment.classes.length > 0
			? assignment.classes.map((c) => c.class?.name).filter(Boolean).join(', ')
			: 'Kelas'
	);

	let previewText = $derived(
		assignment.description
			? assignment.description.replace(/<[^>]*>?/gm, '').trim()
			: ''
	);

	function formatDate(dateStr: string) {
		if (!dateStr) return '-';
		return new Date(dateStr).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	let defaultHref = $derived(
		href || (role === 'teacher' ? `/teacher/assignments/${assignment.id}` : `/student/assignments/${assignment.id}`)
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
				<Badge variant="primary" icon="assignment" text="Tugas" />

				<!-- 2. Nama Mapel -->
				<Badge variant="neutral" icon="book" text={subjectName} />

				<!-- 3. Kelas -->
				<Badge variant="neutral" icon="school" text={targetClassName} />

				<!-- 4. Counter -->
				{#if role === 'teacher'}
					<Badge
						variant="info"
						icon="group"
						text={`${assignment.submissionStats?.submittedCount ?? 0}/${assignment.submissionStats?.totalStudents ?? 0} dikerjakan`}
					/>
				{:else}
					<!-- Student View -->
					{#if assignment.isSubmitted || assignment.submission}
						<Badge variant="success" icon="check_circle" text="Sudah Dikerjakan" />
					{:else}
						<Badge variant="error" icon="pending_actions" text="Belum Dikerjakan" />
					{/if}
				{/if}
			</div>

			{#if showStatus && role === 'teacher'}
				<div>
					{#if assignment.status === 'Draft'}
						<Badge variant="warning" icon="drafts" text="Draft" />
					{:else}
						<Badge variant="success" icon="check_circle" text="Published" />
					{/if}
				</div>
			{/if}
		</div>

		<div class="p-6">
			<h3 class="font-headline-md text-xl font-bold text-on-surface mb-2">{assignment.title}</h3>

			<!-- Guru beserta Gelar -->
			{#if teacherName}
				<div class="flex items-center gap-2 text-sm font-label-bold text-secondary mb-4 bg-surface-container/60 p-2.5 neo-border">
					<div class="w-7 h-7 bg-white neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
						<span class="material-symbols-outlined text-base text-on-surface">person</span>
					</div>
					<span class="truncate">Guru: {teacherName}</span>
				</div>
			{/if}

			<p class="font-body-md text-on-surface mb-4 leading-relaxed line-clamp-3">
				{previewText.slice(0, 200)}{previewText.length > 200 ? '...' : ''}
			</p>

			<div class="flex items-center justify-between text-xs font-label-bold text-secondary border-t-2 border-on-surface/20 pt-3 mt-4">
				<div class="flex items-center gap-1 text-error font-bold">
					<span class="material-symbols-outlined text-sm">event</span>
					<span>Deadline: {formatDate(assignment.deadline)}</span>
				</div>

				{#if assignment.attachments && assignment.attachments.length > 0}
					<div class="flex items-center gap-1">
						<span class="material-symbols-outlined text-sm">attach_file</span>
						<span>{assignment.attachments.length} lampiran</span>
					</div>
				{/if}
			</div>
		</div>
	</article>
</a>
