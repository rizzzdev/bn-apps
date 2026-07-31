<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authState } from '$lib/features/auth/auth.svelte';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import { toast } from '$lib/features/toast/toast.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';
	import { getAttachmentUrl } from '$lib/utils/attachment';

	let id = $derived($page.params.id as string);

	async function loadData() {
		const [assignment, submission] = await Promise.all([
			lmsStore.getAssignment(id),
			lmsStore.getMySubmission(id),
		]);
		return { assignment, submission };
	}

	let dataPromise = $derived(loadData());

	let content = $state('');
	let files = $state<{ url: string; name: string }[]>([]);
	let submitting = $state(false);
	let showConfirmSubmit = $state(false);
	let currentAssignmentId = $state('');

	function openSubmitConfirmation() {
		if (!content && files.length === 0) {
			toast.warning('Harap isi jawaban atau lampirkan file terlebih dahulu.');
			return;
		}
		showConfirmSubmit = true;
	}

	async function handleSubmit() {
		submitting = true;
		try {
			await lmsStore.submitAssignment(id, {
				content: content || undefined,
				fileUrl: files[0]?.url,
				fileName: files[0]?.name,
			});
			showConfirmSubmit = false;
			toast.success('Tugas berhasil dikumpulkan!');
			dataPromise = loadData();
		} catch (err: any) {
			toast.error(err.message || 'Gagal mengumpulkan tugas.');
		} finally {
			submitting = false;
		}
	}
</script>

{#await dataPromise}
	<div class="w-full">
		<div class="animate-pulse space-y-6">
			<div class="h-8 bg-surface-container neo-border w-1/2"></div>
			<div class="h-48 bg-surface-container neo-border w-full"></div>
		</div>
	</div>
{:then { assignment, submission }}
	{#if !assignment}
		<div class="w-full">
			<div class="flex flex-col items-center justify-center p-12 bg-surface-container-lowest neo-border shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] text-center">
				<span class="material-symbols-outlined text-6xl text-error mb-4" style="font-variation-settings: 'FILL' 1;">error</span>
				<h2 class="font-headline-md text-2xl font-black mb-2">Tugas Tidak Ditemukan</h2>
				<p class="font-body-md text-secondary">Tugas yang Anda cari tidak tersedia.</p>
			</div>
		</div>
	{:else}
		{@const subjectName = assignment.teacher?.subjectTeachers?.length ? assignment.teacher.subjectTeachers.map((st: any) => st.subject?.name).filter(Boolean).join(', ') : 'Umum'}
		{@const teacherName = assignment.teacher ? `${assignment.teacher.prefixTitle?.trim() ? assignment.teacher.prefixTitle.trim() + ' ' : ''}${assignment.teacher.fullname.trim()}${assignment.teacher.suffixTitle?.trim() ? ', ' + assignment.teacher.suffixTitle.trim() : ''}` : 'Guru'}
		{@const className = assignment.class?.name ?? assignment.classes?.map((c) => c.class?.name).filter(Boolean).join(', ') ?? '-'}

		<div class="w-full flex flex-col gap-6">
			<div class="mb-6">
				<Button variant="outline" onclick={() => goto('/student/assignments')}>
					<span class="material-symbols-outlined">arrow_back</span>
					Kembali
				</Button>
			</div>

			<div class="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 mb-6">
				<div class="mb-6 flex flex-col gap-3">
					<div class="flex items-center gap-2 flex-wrap">
						<Badge variant="primary" icon="assignment" text="Tugas" />
						<Badge variant="neutral" icon="book" text={subjectName} />
						<Badge variant="neutral" icon="school" text={`Kelas: ${className}`} />
						{#if submission}
							<Badge variant="success" icon="check_circle" text="Sudah Dikerjakan" />
						{:else}
							<Badge variant="error" icon="pending_actions" text="Belum Dikerjakan" />
						{/if}
					</div>

					<h2 class="font-display-lg text-3xl font-black tracking-tight">{assignment.title}</h2>

					<div class="flex flex-wrap items-center gap-4 text-sm text-secondary font-label-bold bg-surface-container/60 p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
						<div class="flex items-center gap-2">
							<span class="material-symbols-outlined text-sm text-on-surface">person</span>
							<span>Guru: {teacherName}</span>
						</div>
						<div class="flex items-center gap-1 ml-auto text-error font-bold">
							<span class="material-symbols-outlined text-sm">event</span>
							<span>Deadline: {new Date(assignment.deadline).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
						</div>
					</div>
				</div>

				<div class="border-t-2 border-on-surface pt-6">
					<MarkdownRenderer content={assignment.description} />
				</div>

				{#if assignment.attachments && assignment.attachments.length > 0}
					<div class="border-t-2 border-on-surface mt-8 pt-6">
						<h3 class="font-headline-md text-lg font-bold mb-4 flex items-center gap-2">
							<span class="material-symbols-outlined">attach_file</span>
							Lampiran Tugas
						</h3>
						<div class="flex flex-col gap-3">
							{#each assignment.attachments as att}
								<a
									href={getAttachmentUrl(att.fileUrl)}
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center gap-3 p-3 neo-border bg-surface hover:bg-primary-container transition-colors group"
								>
									<div class="w-10 h-10 bg-error text-white neo-border flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
										<span class="material-symbols-outlined">description</span>
									</div>
									<div class="min-w-0 flex-1">
										<p class="font-label-bold text-sm truncate">{att.fileName}</p>
									</div>
									<span class="material-symbols-outlined text-secondary shrink-0">open_in_new</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Submission Area -->
			<div class="mt-8">
				{#if submission}
					<Card>
						<h3 class="font-headline-md text-lg font-bold mb-4 flex items-center gap-2">
							<span class="material-symbols-outlined">check_circle</span>
							Pengumpulan Anda
						</h3>
						<div class="bg-primary-container neo-border p-4 mb-4">
							<div class="flex items-center gap-2 mb-2">
								<Badge variant="success">Sudah Dikumpulkan</Badge>
							</div>
							<p class="font-body-md text-sm">
								{new Date(submission.createdAt || Date.now()).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
							</p>
							{#if submission.fileUrl}
								<a href={getAttachmentUrl(submission.fileUrl)} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 mt-3 text-primary font-label-bold text-sm">
									<span class="material-symbols-outlined text-sm">description</span>
									{submission.fileName || 'Lihat File'}
								</a>
							{/if}
						</div>

						{#if submission.grade !== null}
							<div class="border-t-2 border-on-surface pt-4 mt-4">
								<div class="flex items-center gap-4">
									<h4 class="font-headline-md font-bold">Nilai</h4>
									<div class="px-4 py-2 bg-on-surface text-surface neo-border font-label-bold text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
										{submission.grade}
									</div>
								</div>
								{#if submission.feedback}
									<div class="mt-4">
										<h5 class="font-label-bold text-sm mb-2">Umpan Balik</h5>
										<div class="bg-surface neo-border p-4 font-body-md">
											{submission.feedback}
										</div>
									</div>
								{/if}
							</div>
						{:else}
							<div class="border-t-2 border-on-surface pt-4 mt-4">
								<Badge variant="secondary">Menunggu Penilaian</Badge>
							</div>
						{/if}
					</Card>
				{/if}

				{#if !submission || submission.grade === null}
					<Card>
						<h3 class="font-headline-md text-lg font-bold mb-4 flex items-center gap-2">
							<span class="material-symbols-outlined">edit_note</span>
							{!submission ? 'Kumpulkan Tugas' : 'Perbarui Pengumpulan'}
						</h3>

						<div class="space-y-6">
							<div>
								<span class="font-label-bold text-sm uppercase tracking-wider mb-2 block">Jawaban</span>
								<RichTextEditor bind:value={content} placeholder="Tulis jawaban Anda di sini..." />
							</div>

							<div>
								<span class="font-label-bold text-sm uppercase tracking-wider mb-2 block">Lampiran File</span>
								<FileUpload bind:files />
							</div>

							<div class="flex justify-end">
								<Button variant="primary" onclick={openSubmitConfirmation} disabled={submitting || (!content && files.length === 0)}>
									{!submission ? 'Kumpulkan' : 'Perbarui Pengumpulan'}
								</Button>
							</div>
						</div>
					</Card>
				{/if}
			</div>
		</div>

		<!-- Confirmation Modal -->
		<ConfirmationModal
			bind:open={showConfirmSubmit}
			title="Konfirmasi Pengumpulan Tugas"
			message="Apakah Anda yakin ingin mengumpulkan tugas ini? Pastikan jawaban dan lampiran sudah benar."
			confirmText="Ya, Kumpulkan"
			cancelText="Batal"
			icon="assignment_turned_in"
			variant="primary"
			loading={submitting}
			onconfirm={handleSubmit}
		/>
	{/if}
{:catch error}
	<div class="max-w-3xl mx-auto mt-4">
		<div class="bg-error-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
			<p class="font-bold text-error text-lg">Gagal memuat tugas.</p>
			<p class="text-error text-sm mt-2">{error.message}</p>
		</div>
	</div>
{/await}
