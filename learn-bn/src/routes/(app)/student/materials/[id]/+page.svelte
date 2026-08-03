<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { lmsStore } from '$lib/features/lms/lms-store.svelte';
	import { toast } from '$lib/features/toast/toast.svelte';
	import { getAttachmentUrl } from '$lib/utils/attachment';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	let id = $derived($page.params.id as string);
	let materialPromise = $derived(lmsStore.getMaterial(id));

	let isSubmitting = $state(false);
	let localIsRead = $state<boolean | null>(null);
	let localReadAt = $state<string | null>(null);
	let showConfirmRead = $state(false);

	async function handleMarkAsRead(materialId: string) {
		isSubmitting = true;
		try {
			const res = await lmsStore.markMaterialAsRead(materialId);
			localIsRead = true;
			localReadAt = res.readAt;
			showConfirmRead = false;
			toast.success('Materi berhasil ditandai sebagai sudah dibaca.');
		} catch (err: any) {
			toast.error(err.message || 'Gagal menandai materi sebagai telah dibaca.');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Detail Materi - Akademik-BN</title>
</svelte:head>

{#await materialPromise}
	<div class="w-full">
		<div class="animate-pulse space-y-6">
			<div class="h-8 bg-surface-container neo-border w-1/2"></div>
			<div class="h-64 bg-surface-container neo-border w-full"></div>
		</div>
	</div>
{:then material}
	{#if !material}
		<div class="w-full">
			<div class="flex flex-col items-center justify-center p-12 bg-surface-container-lowest neo-border shadow-[8px_8px_0px_0px_rgba(26,28,28,1)] text-center">
				<span class="material-symbols-outlined text-6xl text-error mb-4" style="font-variation-settings: 'FILL' 1;">error</span>
				<h2 class="font-headline-md text-2xl font-black mb-2">Materi Tidak Ditemukan</h2>
				<p class="font-body-md text-secondary">Materi yang Anda cari tidak tersedia.</p>
			</div>
		</div>
	{:else}
		{@const subjectName = material.teacher?.subjectTeachers?.length ? material.teacher.subjectTeachers.map((st: any) => st.subject?.name).filter(Boolean).join(', ') : 'Materi Umum'}
		{@const teacherName = material.teacher ? `${material.teacher.prefixTitle?.trim() ? material.teacher.prefixTitle.trim() + ' ' : ''}${material.teacher.fullname.trim()}${material.teacher.suffixTitle?.trim() ? ', ' + material.teacher.suffixTitle.trim() : ''}` : 'Guru'}
		{@const targetClasses = material.classes?.length ? material.classes.map((c: any) => c.class?.name).filter(Boolean).join(', ') : '-'}
		{@const readStatus = localIsRead !== null ? localIsRead : material.isRead}
		{@const readTime = localReadAt !== null ? localReadAt : material.readAt}

		<div class="w-full flex flex-col gap-6">
			<div class="mb-6">
				<Button variant="outline" onclick={() => goto('/student/materials')}>
					<span class="material-symbols-outlined">arrow_back</span>
					Kembali
				</Button>
			</div>

			<div class="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 mb-6">
				<div class="mb-6 flex flex-col gap-3">
					<div class="flex items-center gap-2 flex-wrap">
						<Badge variant="primary" icon="menu_book" text="Materi" />
						<Badge variant="neutral" icon="book" text={subjectName} />
						<Badge variant="neutral" icon="school" text={`Kelas: ${targetClasses}`} />
						{#if readStatus}
							<Badge variant="success" icon="check_circle" text="Sudah Dibaca" />
						{:else}
							<Badge variant="warning" icon="mark_email_unread" text="Belum Dibaca" />
						{/if}
					</div>

					<h2 class="font-display-lg text-3xl font-black tracking-tight">{material.title}</h2>

					<div class="flex flex-wrap items-center gap-4 text-sm text-secondary font-label-bold bg-surface-container/60 p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
						<div class="flex items-center gap-2">
							<span class="material-symbols-outlined text-sm text-on-surface">person</span>
							<span>Guru: {teacherName}</span>
						</div>
						<div class="flex items-center gap-1 ml-auto">
							<span class="material-symbols-outlined text-sm">calendar_today</span>
							<span>{new Date(material.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
						</div>
					</div>
				</div>

				<div class="border-t-2 border-on-surface pt-6">
					<MarkdownRenderer content={material.content} />
				</div>

				{#if material.attachments && material.attachments.length > 0}
					<div class="border-t-2 border-on-surface mt-8 pt-6">
						<h3 class="font-headline-md text-lg font-bold mb-4 flex items-center gap-2">
							<span class="material-symbols-outlined">attach_file</span>
							Lampiran File Materi ({material.attachments.length})
						</h3>
						<div class="flex flex-col gap-3">
							{#each material.attachments as att}
								<a
									href={getAttachmentUrl(att.fileUrl)}
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-center gap-3 p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-surface hover:bg-primary-container transition-colors group"
								>
									<div class="w-10 h-10 bg-error text-white border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
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

				<!-- Seksi Konfirmasi Sudah Membaca Materi -->
				<div class="border-t-2 border-on-surface mt-8 pt-6 flex flex-col items-center gap-4">
					{#if readStatus}
						<div class="w-full bg-primary-container/30 border-2 border-black p-4 flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
							<div class="w-10 h-10 bg-primary text-on-primary border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
								<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">check_circle</span>
							</div>
							<div class="text-left">
								<p class="font-headline-md text-base font-bold text-on-surface">Anda Telah Membaca Materi Ini</p>
								{#if readTime}
									<p class="font-body-md text-xs text-secondary">
										Dikonfirmasi pada {new Date(readTime).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
									</p>
								{/if}
							</div>
						</div>
					{:else}
						<div class="w-full bg-surface-container border-2 border-black p-6 flex flex-col items-center gap-4 text-center shadow-[4px_4px_0px_0px_rgba(26,28,28,1)]">
							<div>
								<h4 class="font-headline-md text-lg font-bold mb-1">Sudah Selesai Membaca?</h4>
								<p class="font-body-md text-sm text-secondary">Konfirmasi di bawah untuk menandai bahwa Anda telah mempelajari seluruh materi ini.</p>
							</div>
							<Button
								variant="primary"
								onclick={() => (showConfirmRead = true)}
								class="px-8 py-3 font-label-bold text-base"
							>
								<span class="material-symbols-outlined">check_circle</span>
								<span>Konfirmasi Sudah Membaca</span>
							</Button>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Confirmation Modal -->
		<ConfirmationModal
			bind:open={showConfirmRead}
			title="Konfirmasi Sudah Membaca"
			message="Apakah Anda yakin sudah selesai membaca dan memahami seluruh isi materi ini? Tindakan ini tidak dapat dibatalkan."
			confirmText="Ya, Sudah Membaca"
			cancelText="Batal"
			icon="menu_book"
			variant="primary"
			loading={isSubmitting}
			onconfirm={() => handleMarkAsRead(material.id)}
		/>
	{/if}
{:catch error}
	<div class="max-w-3xl mx-auto mt-4">
		<div class="bg-error-container p-12 neo-border text-center flex flex-col items-center">
			<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
			<p class="font-bold text-error text-lg">Gagal memuat materi.</p>
			<p class="text-error text-sm mt-2">{error.message}</p>
		</div>
	</div>
{/await}
