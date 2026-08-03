<script lang="ts">
	import type { Material } from '$lib/features/lms/lms-store.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let {
		material,
		href,
		showStatus = false,
		role = 'student'
	}: {
		material: Material;
		href?: string;
		showStatus?: boolean;
		role?: 'student' | 'teacher';
	} = $props();

	let subjectName = $derived(
		material.teacher?.subjectTeachers && material.teacher.subjectTeachers.length > 0
			? material.teacher.subjectTeachers.map((st) => st.subject?.name).filter(Boolean).join(', ')
			: 'Umum'
	);

	let teacherName = $derived(
		(() => {
			if (!material.teacher) return 'Guru';
			const prefix = material.teacher.prefixTitle?.trim() ? `${material.teacher.prefixTitle.trim()} ` : '';
			const suffix = material.teacher.suffixTitle?.trim() ? `, ${material.teacher.suffixTitle.trim()}` : '';
			return `${prefix}${material.teacher.fullname.trim()}${suffix}`;
		})()
	);

	let targetClasses = $derived(
		material.classes && material.classes.length > 0
			? material.classes.map((c) => c.class?.name).filter(Boolean).join(', ')
			: '-'
	);

	let previewText = $derived(
		material.content
			? material.content.replace(/<[^>]*>?/gm, '').trim()
			: ''
	);
</script>

<a {href} class="block">
	<article
		class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] transition-all duration-200"
	>
		<div class="border-b-2 border-on-surface bg-surface-container p-4 flex flex-wrap items-center justify-between gap-2">
			<!-- Format Badge: Jenis, Nama Mapel, Kelas, Counter -->
			<div class="flex items-center gap-2 flex-wrap">
				<!-- 1. Jenis -->
				<Badge variant="primary" icon="menu_book" text="Materi" />

				<!-- 2. Nama Mapel -->
				<Badge variant="neutral" icon="book" text={subjectName} />

				<!-- 3. Kelas -->
				<Badge variant="neutral" icon="school" text={targetClasses} />

				<!-- 4. Counter -->
				{#if role === 'teacher'}
					{#if material.readStats}
						<Badge
							variant="info"
							icon="visibility"
							text={`${material.readStats.readCount}/${material.readStats.totalStudents} dibaca`}
						/>
					{/if}
				{:else}
					<!-- Student View -->
					{#if material.isRead}
						<Badge variant="success" icon="check_circle" text="Sudah Dibaca" />
					{:else}
						<Badge variant="warning" icon="mark_email_unread" text="Belum Dibaca" />
					{/if}
				{/if}
			</div>

			{#if showStatus && role === 'teacher'}
				<div>
					{#if material.status === 'Draft'}
						<Badge variant="warning" icon="drafts" text="Draft" />
					{:else}
						<Badge variant="success" icon="check_circle" text="Published" />
					{/if}
				</div>
			{/if}
		</div>

		<div class="p-6">
			<h3 class="font-headline-md text-xl font-bold text-on-surface mb-2">{material.title}</h3>

			<!-- Guru beserta Gelar -->
			<div class="flex items-center gap-2 text-sm font-label-bold text-secondary mb-4 bg-surface-container/60 p-2.5 neo-border">
				<div class="w-7 h-7 bg-white neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-base text-on-surface">person</span>
				</div>
				<span class="truncate">Guru: {teacherName}</span>
			</div>

			<p class="font-body-md text-on-surface mb-4 leading-relaxed line-clamp-3">
				{previewText.slice(0, 200)}{previewText.length > 200 ? '...' : ''}
			</p>

			<div class="flex items-center justify-between text-xs font-label-bold text-secondary border-t-2 border-on-surface/20 pt-3 mt-4">
				<div class="flex items-center gap-1">
					<span class="material-symbols-outlined text-sm">calendar_today</span>
					<span>{new Date(material.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
				</div>

				{#if material.attachments && material.attachments.length > 0}
					<div class="flex items-center gap-1">
						<span class="material-symbols-outlined text-sm">attach_file</span>
						<span>{material.attachments.length} lampiran</span>
					</div>
				{/if}
			</div>
		</div>
	</article>
</a>
