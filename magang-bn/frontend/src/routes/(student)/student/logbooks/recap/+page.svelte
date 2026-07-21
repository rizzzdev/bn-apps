<script lang="ts">
	import { Icon, Button, ActionButton } from '$lib/components/atoms';
	import { apiClient } from '$lib/utils/api';
	import { formatFullName } from '$lib/utils/helpers';
	import { page } from '$app/stores';
	import { onMount, untrack } from 'svelte';
	import { PUBLIC_API_URL } from '$env/static/public';
	
	let placementId = $state('');
	let placements: any[] = $state([]);
	let logbooks: any[] = $state([]);
	let isLoadingPlacements = $state(true);
	let isLoadingLogbooks = $state(false);
	let error = $state('');

	let currentPage = $state(1);
	let totalPages = $state(1);
	let _prevPlacementId = $state('');

	onMount(async () => {
		const studentId = $page.data.profileData?.studentId;
		if (studentId) {
			const res = await apiClient(`/api/v1/internship-placements?studentId=${studentId}&limit=100`);
			if (res && !res.error) {
				placements = res.data?.filter((p: any) => p.status === 'active' || p.status === 'approved') || [];
			}
		}
		isLoadingPlacements = false;
	});

	let searchQuery = $state('');

	$effect(() => {
		if (placementId !== _prevPlacementId) {
			currentPage = 1;
			searchQuery = '';
			_prevPlacementId = placementId;
		}
		
		const _page = currentPage;
		if (placementId) {
			untrack(() => { if (!isLoadingLogbooks) fetchLogbooks(); });
		}
	});

	function handleSearch() {
		currentPage = 1;
		fetchLogbooks();
	}

	async function fetchLogbooks() {
		isLoadingLogbooks = true;
		error = '';
		const currentSearch = untrack(() => searchQuery);
		const searchParam = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : "";
		const res = await apiClient(`/api/v1/daily-logbooks?placementId=${placementId}&page=${currentPage}&limit=10${searchParam}`);
		if (res && !res.error) {
			logbooks = res.data || [];
			if (res.pagination) {
				totalPages = res.pagination.totalPage || 1;
				currentPage = res.pagination.currentPage || 1;
			}
		} else {
			error = res?.message || 'Gagal memuat logbook';
			logbooks = [];
			totalPages = 1;
		}
		isLoadingLogbooks = false;
	}

	function formatDate(dateString: string) {
		const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
		return new Date(dateString).toLocaleDateString('id-ID', options);
	}

	// formatName diganti dengan formatFullName dari helpers
	
	function formatDateRange(start: string, end: string) {
		if (!start || !end) return '-';
		const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
		const s = new Date(start).toLocaleDateString('id-ID', options);
		const e = new Date(end).toLocaleDateString('id-ID', options);
		return `${s} - ${e}`;
	}

	import { Modal, Toast, Pagination, SearchFilter } from '$lib/components/molecules';

	let showModal = $state(false);
	let isSubmitting = $state(false);
	let showToast = $state(false);
	let toastType = $state<'success' | 'error'>('success');
	let toastMessage = $state('');

	// Update form state
	let editLogbookId = $state('');
	let date = $state('');
	let activityTitle = $state('');
	let description = $state('');
	
	let existingAttachments = $state<any[]>([]);
	let deletedAttachmentIds = $state<string[]>([]);
	let newAttachments = $state<File[]>([]);
	let fileInput = $state<HTMLInputElement | null>(null);

	function openEditModal(logbook: any) {
		editLogbookId = logbook.id;
		date = new Date(logbook.date).toISOString().split('T')[0];
		activityTitle = logbook.activityTitle || '';
		description = logbook.description || '';
		
		existingAttachments = logbook.attachments || [];
		deletedAttachmentIds = [];
		newAttachments = [];
		
		showModal = true;
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) {
			const files = Array.from(target.files);
			const invalidFiles = files.filter(f => f.size > 5 * 1024 * 1024);
			if (invalidFiles.length > 0) {
				toastType = 'error';
				toastMessage = 'Beberapa file gagal ditambahkan karena melebihi batas 5MB.';
				showToast = true;
			}
			const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
			newAttachments = [...newAttachments, ...validFiles];
		}
		if (fileInput) fileInput.value = '';
	}

	function formatBytesToMB(bytes: number) {
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	}

	function removeNewFile(index: number) {
		newAttachments = newAttachments.filter((_, i) => i !== index);
	}

	function removeExistingFile(id: string) {
		deletedAttachmentIds = [...deletedAttachmentIds, id];
		existingAttachments = existingAttachments.filter(a => a.id !== id);
	}

	async function handleUpdateSubmit(e: Event) {
		e.preventDefault();
		isSubmitting = true;

		const formData = new FormData();
		formData.append('date', new Date(date).toISOString());
		formData.append('activityTitle', activityTitle);
		if (description) formData.append('description', description);
		
		deletedAttachmentIds.forEach(id => {
			formData.append('deletedAttachmentIds', id);
		});

		newAttachments.forEach(file => {
			formData.append('attachments', file);
		});

		const res = await apiClient(`/api/v1/daily-logbooks/${editLogbookId}`, {
			method: 'PUT',
			body: formData
		});

		isSubmitting = false;

		if (res && !res.error) {
			toastType = 'success';
			toastMessage = "Logbook berhasil diperbarui!";
			showToast = true;
			showModal = false;
			// Refresh list
			fetchLogbooks();
		} else {
			toastType = 'error';
			toastMessage = res?.message || "Gagal memperbarui logbook!";
			showToast = true;
		}
	}
</script>

<svelte:head>
	<title>Recap Logbook | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up">
	<div class="flex justify-between items-center">
		<div>
			<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Recap Logbook</h2>
			<p class="font-mono text-secondary mt-1">Riwayat aktivitas logbook harian magangmu.</p>
		</div>
		<Button variant="secondary" href="/student/logbooks">
			<Icon name="add" /> Tulis Logbook
		</Button>
	</div>
</div>

{#if isLoadingPlacements}
	<div class="flex justify-center items-center py-12">
		<Icon name="refresh" class="animate-spin text-4xl text-primary" />
	</div>
{:else if placements.length === 0}
	<div class="border-4 border-on-background bg-surface shadow-neo p-8 text-center animate-fade-in-up relative z-20">
		<Icon name="work_off" class="text-6xl text-secondary mb-4" />
		<h3 class="font-headline text-2xl font-black uppercase mb-2">Tidak Ada Magang Aktif</h3>
		<p class="font-mono text-secondary">Kamu belum memiliki penempatan magang yang aktif saat ini.</p>
	</div>
{:else}
	<div class="mb-8 animate-fade-in-up" style="animation-delay: 0.1s;">
		<h3 class="font-headline text-xl font-black uppercase mb-4">Pilih Penempatan Magang</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each placements as placement}
				<button 
					type="button"
					class="text-left flex flex-col justify-between border-4 border-on-background p-6 bg-surface transition-all {placementId === placement.id ? 'shadow-neo ring-4 ring-primary' : 'hover:-translate-y-1 hover:shadow-neo-sm'}"
					onclick={() => placementId = placement.id}
				>
					<div class="w-full">
						<div class="flex justify-between items-start mb-4">
							<h4 class="font-headline font-black text-xl text-on-background">{placement.company?.name || 'Perusahaan'}</h4>
							<span class="bg-primary text-on-primary border-2 border-on-background px-2 py-1 text-xs font-bold uppercase font-mono">
								{placement.status === 'active' ? 'Aktif' : 'Disetujui'}
							</span>
						</div>
						
						<div class="space-y-3 font-mono text-sm text-secondary">
							<div class="flex items-center gap-3">
								<div class="bg-on-background/5 p-2 rounded-full">
									<Icon name="calendar_today" class="text-xl text-on-background" />
								</div>
								<div class="flex flex-col">
									<span class="text-[10px] uppercase font-bold text-secondary">Periode Magang</span>
									<span class="text-on-background font-bold">{formatDateRange(placement.startDate, placement.endDate)}</span>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<div class="bg-on-background/5 p-2 rounded-full">
									<Icon name="school" class="text-xl text-on-background" />
								</div>
								<div class="flex flex-col">
									<span class="text-[10px] uppercase font-bold text-secondary">Guru Pembimbing</span>
									<span class="text-on-background font-bold">{formatFullName(placement.teacher)}</span>
								</div>
							</div>
							<div class="flex items-center gap-3">
								<div class="bg-on-background/5 p-2 rounded-full">
									<Icon name="work" class="text-xl text-on-background" />
								</div>
								<div class="flex flex-col">
									<span class="text-[10px] uppercase font-bold text-secondary">Mentor Industri</span>
									<span class="text-on-background font-bold">{formatFullName(placement.industryMentor)}</span>
								</div>
							</div>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</div>

	{#if placementId}
		<div class="animate-fade-in-up relative z-20" style="animation-delay: 0.2s;">
			{#if isLoadingLogbooks}
				<div class="flex justify-center py-12">
					<Icon name="refresh" class="animate-spin text-4xl text-primary" />
				</div>
			{:else if error}
				<div class="bg-error/10 text-error p-4 border-4 border-error mb-4 font-bold">
					{error}
				</div>
			{:else}
				<div class="mb-6">
					<SearchFilter bind:searchQuery onSearch={handleSearch} placeholder="Cari Kegiatan / Deskripsi..." />
				</div>
				
				{#if logbooks.length === 0}
					<div class="border-4 border-on-background bg-surface shadow-neo p-8 text-center">
						<Icon name="menu_book" class="text-6xl text-secondary mb-4" />
						<h3 class="font-headline text-2xl font-black uppercase mb-2">Belum Ada Logbook</h3>
						<p class="font-mono text-secondary mb-4">Belum ada logbook yang sesuai dengan pencarian Anda.</p>
						<Button href="/student/logbooks" variant="primary">Mulai Tulis Logbook</Button>
					</div>
				{:else}
				<div class="space-y-4">
					{#each logbooks as logbook}
						<div class="border-4 border-on-background bg-surface shadow-neo p-6 transition-all hover:translate-y-1">
							<div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-2">
								<div>
									<h3 class="font-headline text-xl font-black">{logbook.activityTitle}</h3>
									<div class="flex gap-2 mt-2">
										<span class="text-[10px] px-2 py-1 font-bold font-mono uppercase {logbook.mentorStatus === 'approved' ? 'bg-success text-on-background border-2 border-on-background' : logbook.mentorStatus === 'rejected' ? 'bg-error text-white border-2 border-on-background' : 'bg-secondary text-white'}">
											Mentor: {logbook.mentorStatus === 'approved' ? 'Disetujui' : logbook.mentorStatus === 'rejected' ? 'Revisi' : 'Menunggu'}
										</span>
										<span class="text-[10px] px-2 py-1 font-bold font-mono uppercase {logbook.teacherStatus === 'approved' ? 'bg-success text-on-background border-2 border-on-background' : logbook.teacherStatus === 'rejected' ? 'bg-error text-white border-2 border-on-background' : 'bg-secondary text-white'}">
											Guru: {logbook.teacherStatus === 'approved' ? 'Disetujui' : logbook.teacherStatus === 'rejected' ? 'Revisi' : 'Menunggu'}
										</span>
									</div>
								</div>
								
								<div class="flex gap-2">
									<Button variant="secondary" size="sm" onclick={() => openEditModal(logbook)}>
										<Icon name="edit" class="text-sm mr-1" /> Edit
									</Button>
								</div>
							</div>
							<div class="inline-flex items-center gap-1.5 bg-primary border-2 border-on-background text-on-background px-2.5 py-1 mb-4 shadow-[2px_2px_0px_0px_#0f172a]">
								<Icon name="calendar_today" class="text-[14px]" />
								<span class="font-mono text-xs font-black tracking-widest uppercase">{formatDate(logbook.date)}</span>
							</div>
							<p class="text-on-surface whitespace-pre-wrap">{logbook.description}</p>
							
							{#if logbook.attachments && logbook.attachments.length > 0}
								<div class="mt-4 flex flex-col gap-2 pt-4 border-t-2 border-slate-200">
									<span class="text-[10px] uppercase font-bold text-secondary">Lampiran</span>
									<div class="flex flex-wrap gap-2">
										{#each logbook.attachments as att}
									<a href="{PUBLIC_API_URL}{att.url}" target="_blank" class="inline-flex items-center gap-1 bg-surface border-2 border-on-background px-2 py-1 text-xs font-bold font-mono hover:bg-slate-100">
										<Icon name="attachment" class="text-sm" />
										<span class="truncate max-w-[150px]">{att.filename}</span>
									</a>
								{/each}
									</div>
								</div>
							{/if}
							
							{#if logbook.reviews && logbook.reviews.length > 0}
								<div class="mt-6 pt-4 border-t-2 border-slate-200">
									<h4 class="font-headline font-black text-sm uppercase mb-4 flex items-center gap-2">
										<Icon name="history" class="text-secondary" /> Riwayat Review
									</h4>
									<div class="space-y-4">
										{#each logbook.reviews as review}
											<div class="flex gap-4">
												<div class="flex-1 bg-surface border-2 border-on-background p-3 shadow-neo-sm hover:-translate-y-0.5 transition-transform">
													<div class="flex justify-between items-start mb-1">
														<span class="font-bold text-xs font-mono uppercase">
															{#if review.reviewerId === logbook.placement?.teacherId || review.reviewerId === logbook.placement?.teacher?.userId}
																Guru Pembimbing ({logbook.placement?.teacher?.name || '-'})
															{:else if review.reviewerId === logbook.placement?.industryMentorId || review.reviewerId === logbook.placement?.industryMentor?.userId}
																Mentor Industri ({logbook.placement?.industryMentor?.name || '-'})
															{:else}
																Reviewer
															{/if}
															- {review.action === 'approved' ? 'Menerima Logbook' : 'Mengajukan Revisi'}
														</span>
														<span class="text-[10px] text-secondary font-mono">{formatDate(review.createdAt)}</span>
													</div>
													{#if review.content}
														<p class="text-sm mt-2 font-mono whitespace-pre-wrap">{review.content}</p>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<div class="mt-6 flex justify-center sm:justify-end animate-fade-in-up">
					<Pagination bind:currentPage {totalPages} />
				</div>
			{/if}
			{/if}
		</div>
	{/if}
{/if}

<Modal bind:show={showModal} title="Edit Logbook Harian">
	<form onsubmit={handleUpdateSubmit} class="space-y-6">
		<div class="flex flex-col space-y-2">
			<label for="date" class="font-headline font-black uppercase text-sm">Tanggal</label>
			<input id="date" type="date" bind:value={date} required class="border-4 border-on-background p-3 focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all font-mono font-bold bg-surface w-full" />
		</div>
		
		<div class="flex flex-col space-y-2">
			<label for="activityTitle" class="font-headline font-black uppercase text-sm">Judul Kegiatan</label>
			<input id="activityTitle" type="text" bind:value={activityTitle} required class="border-4 border-on-background p-3 focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all font-mono font-bold bg-surface w-full" />
		</div>
		
		<div class="flex flex-col space-y-2">
			<label for="description" class="font-headline font-black uppercase text-sm">Deskripsi Kegiatan</label>
			<textarea id="description" rows="5" bind:value={description} class="border-4 border-on-background p-3 focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all font-mono w-full"></textarea>
		</div>
		
		<div class="flex flex-col space-y-2">
			<span class="font-headline font-black uppercase text-sm">File Pendukung (Lampiran)</span>
			
			{#if existingAttachments.length > 0 || newAttachments.length > 0}
				<div class="mb-4 space-y-2">
					{#each existingAttachments as file}
						<div class="flex justify-between items-center bg-surface border-2 border-on-background p-2">
							<div class="flex items-center gap-2 overflow-hidden">
								<Icon name="attachment" class="text-secondary" />
								<div class="flex flex-col justify-center">
									<span class="font-mono text-xs truncate max-w-[150px]">{file.filename}</span>
									<span class="font-mono text-[10px] text-secondary">{file.size} MB</span>
								</div>
							</div>
							<ActionButton variant="error" icon="delete" label="Hapus Permanen" onclick={() => removeExistingFile(file.id)} />
						</div>
					{/each}
					
					{#each newAttachments as file, i}
						<div class="flex justify-between items-center bg-surface border-2 border-primary border-dashed p-2">
							<div class="flex items-center gap-2 overflow-hidden">
								<Icon name="cloud_upload" class="text-primary" />
								<div class="flex flex-col justify-center">
									<div class="flex items-center gap-2">
										<span class="font-mono text-xs truncate max-w-[150px]">{file.name}</span>
										<span class="text-[10px] bg-primary/20 text-primary px-1 font-bold">Baru</span>
									</div>
									<span class="font-mono text-[10px] text-secondary">{formatBytesToMB(file.size)}</span>
								</div>
							</div>
							<ActionButton variant="error" icon="delete" label="Batal Unggah" onclick={() => removeNewFile(i)} />
						</div>
					{/each}
				</div>
			{/if}

			<label class="border-4 border-dashed border-on-background p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer flex flex-col items-center">
				<Icon name="add_circle" class="text-2xl text-secondary mb-1" />
				<span class="font-bold text-sm">Tambah File...</span>
				<span class="font-mono text-[10px] text-secondary mt-1">Maks ukuran file: 5MB</span>
				<input type="file" multiple class="hidden" accept="image/*,.pdf,.doc,.docx" bind:this={fileInput} onchange={handleFileSelect} />
			</label>
		</div>

		<Button type="submit" variant="success" class="w-full text-lg group" disabled={isSubmitting}>
			<Icon name={isSubmitting ? "hourglass_empty" : "save"} /> {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
		</Button>
	</form>
</Modal>

<Toast bind:show={showToast} type={toastType} message={toastMessage} />
