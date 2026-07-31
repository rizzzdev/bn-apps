<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { lmsStore, type Material } from '$lib/features/lms/lms-store.svelte';
	import { getAttachmentUrl } from '$lib/utils/attachment';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

	let materialId = $derived($page.params.id as string);

	let material = $state<Material | null>(null);
	let classesMap = $state<Record<string, string>>({});
	let loading = $state(true);
	let errorMsg = $state('');

	// Active Tab State per class
	let activeClassId = $state<string>('all');

	// Delete state
	let isDeleting = $state(false);
	let showDeleteModal = $state(false);

	async function loadData() {
		loading = true;
		errorMsg = '';
		try {
			const [fetchedMaterial, fetchedClasses] = await Promise.all([
				lmsStore.getMaterial(materialId),
				lmsStore.getTeacherClasses()
			]);
			material = fetchedMaterial;
			classesMap = Object.fromEntries(fetchedClasses.map((c) => [c.id, c.name]));
		} catch (err: any) {
			errorMsg = err.message || 'Gagal memuat materi';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadData();
	});

	let readersList = $derived(
		material?.readers && material.readers.length > 0
			? material.readers
			: (material?.reads || []).map((r) => ({
					student: r.student,
					class: { id: '', name: '-' },
					isRead: true,
					readAt: r.readAt
			  }))
	);

	let availableClasses = $derived(() => {
		const map = new Map<string, string>();
		for (const item of readersList) {
			if (item.class?.id && item.class?.name && item.class.name !== '-') {
				map.set(item.class.id, item.class.name);
			}
		}
		return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
	});

	let filteredReaders = $derived(
		activeClassId === 'all'
			? readersList
			: readersList.filter((r) => r.class?.id === activeClassId)
	);

	let readCount = $derived(filteredReaders.filter((r) => r.isRead).length);
	let totalStudents = $derived(filteredReaders.length);
	let percentage = $derived(totalStudents > 0 ? Math.round((readCount / totalStudents) * 100) : 0);

	async function handleDelete() {
		if (!material) return;
		isDeleting = true;
		try {
			await lmsStore.deleteMaterial(material.id);
			goto('/teacher/materials');
		} catch (err: any) {
			alert(err.message || 'Gagal menghapus materi');
		} finally {
			isDeleting = false;
			showDeleteModal = false;
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
	<title>{material ? material.title : 'Detail Materi'} - Akademik-BN</title>
</svelte:head>

{#if loading}
	<div class="bg-surface-container-lowest neo-border p-12 text-center w-full">
		<span class="material-symbols-outlined text-4xl text-secondary mb-2 animate-spin">hourglass_empty</span>
		<p class="font-bold text-secondary">Memuat detail materi...</p>
	</div>
{:else if errorMsg || !material}
	<div class="bg-surface-container-lowest neo-border p-12 text-center w-full">
		<span class="material-symbols-outlined text-6xl text-error mb-4">error</span>
		<h2 class="font-headline-md text-2xl font-black mb-2 text-on-surface">{errorMsg || 'Materi Tidak Ditemukan'}</h2>
		<a href="/teacher/materials" class="mt-4 inline-block">
			<Button variant="outline">Kembali ke Daftar Materi</Button>
		</a>
	</div>
{:else}
	{@const subjectName = material.teacher?.subjectTeachers?.length ? material.teacher.subjectTeachers.map((st: any) => st.subject?.name).filter(Boolean).join(', ') : 'Umum'}
	{@const teacherName = material.teacher ? `${material.teacher.prefixTitle?.trim() ? material.teacher.prefixTitle.trim() + ' ' : ''}${material.teacher.fullname.trim()}${material.teacher.suffixTitle?.trim() ? ', ' + material.teacher.suffixTitle.trim() : ''}` : 'Guru'}
	{@const targetClassesText = material.classes?.map((c) => c.class?.name || classesMap[c.classId]).filter(Boolean).join(', ') || classesMap[material.classId || ''] || 'Kelas'}

	<div class="w-full flex flex-col gap-6">
		<!-- Header & Action Buttons -->
		<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
			<div>
				<div class="flex items-center gap-3">
					<h2 class="font-display-lg text-3xl font-black tracking-tight">{material.title}</h2>
					{#if material.status === 'Published'}
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
					<span class="flex items-center gap-1">
						<span class="material-symbols-outlined text-sm">calendar_today</span>
						Dibuat: {formatDate(material.createdAt)}
					</span>
				</div>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<a href={`/teacher/materials/${material.id}/edit`}>
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

		<!-- System Tab per Kelas (Identik dengan detail tugas & kuis) -->
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
					Semua Kelas ({readersList.length})
				</button>

				{#each availableClasses() as cls}
					{@const classCount = readersList.filter((r) => r.class?.id === cls.id).length}
					<button
						type="button"
						onclick={() => (activeClassId = cls.id)}
						class="inline-flex items-center gap-2 px-4 py-2 font-label-bold text-sm uppercase transition-all duration-100 cursor-pointer {activeClassId === cls.id
							? 'bg-primary-container neo-border neo-shadow'
							: 'bg-surface-container-lowest border-2 border-on-surface hover:bg-surface-container'}"
					>
						<span class="material-symbols-outlined text-sm">school</span>
						{cls.name} ({classCount})
					</button>
				{/each}
			</nav>
		{/if}

		<!-- Ringkasan Statistik Pembaca (Identik dengan detail tugas 3-grid) -->
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
					<p class="font-label-bold text-xs text-secondary uppercase">Sudah Membaca</p>
					<p class="font-display-lg text-xl font-black">{readCount} / {totalStudents}</p>
				</div>
			</div>

			<div class="bg-surface-container-lowest neo-border p-4 flex items-center gap-3">
				<div class="w-10 h-10 bg-tertiary/20 neo-border flex items-center justify-center">
					<span class="material-symbols-outlined text-tertiary">analytics</span>
				</div>
				<div>
					<p class="font-label-bold text-xs text-secondary uppercase">Persentase Pembaca</p>
					<p class="font-display-lg text-xl font-black">{percentage}%</p>
				</div>
			</div>
		</div>

		<!-- Tabel Monitoring Pembaca Siswa -->
		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
			<h3 class="font-headline-md text-lg font-bold flex items-center gap-2 mb-4">
				<span class="material-symbols-outlined">how_to_reg</span>
				Daftar Pembaca Siswa
				{#if activeClassId !== 'all'}
					<span class="text-secondary font-normal text-sm">
						({availableClasses().find((c) => c.id === activeClassId)?.name || ''})
					</span>
				{/if}
			</h3>

			{#if filteredReaders.length === 0}
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
								<th class="p-3 border-r-2 border-on-surface">Status Baca</th>
								<th class="p-3 text-left">Waktu Membaca</th>
							</tr>
						</thead>
						<tbody class="divide-y-2 divide-on-surface">
							{#each filteredReaders as item, idx}
								<tr class="hover:bg-surface-container/50">
									<td class="p-3 text-center border-r-2 border-on-surface font-bold">{idx + 1}</td>
									<td class="p-3 border-r-2 border-on-surface font-bold">
										<div class="flex items-center gap-2">
											{#if item.student?.pictureUrl}
												<img src={item.student.pictureUrl} alt={item.student.fullname} class="w-7 h-7 rounded-full neo-border object-cover" />
											{:else}
												<span class="material-symbols-outlined text-secondary text-base">person</span>
											{/if}
											<span>{item.student?.fullname}</span>
										</div>
									</td>
									<td class="p-3 border-r-2 border-on-surface font-mono text-xs">{item.student?.nis || '-'}</td>
									{#if activeClassId === 'all' && availableClasses().length > 1}
										<td class="p-3 border-r-2 border-on-surface font-label-bold text-xs uppercase">
											{item.class?.name || '-'}
										</td>
									{/if}
									<td class="p-3 border-r-2 border-on-surface">
										{#if item.isRead}
											<Badge variant="success">Sudah Dibaca</Badge>
										{:else}
											<Badge variant="outline">Belum Dibaca</Badge>
										{/if}
									</td>
									<td class="p-3 text-xs text-secondary font-mono">
										{formatDate(item.readAt)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<!-- Detail Isi Materi & Lampiran Guru (Diletakkan di Paling Bawah) -->
		<div class="bg-surface-container-lowest neo-border shadow-[4px_4px_0px_0px_rgba(26,28,28,1)] p-6">
			<h3 class="font-headline-md text-lg font-bold mb-3 flex items-center gap-2">
				<span class="material-symbols-outlined">menu_book</span>
				Isi Materi Pembelajaran
			</h3>

			<!-- Bar Profil Guru -->
			<div class="flex items-center gap-2 text-sm font-label-bold text-secondary mb-4 bg-surface-container/60 p-2.5 neo-border">
				<div class="w-7 h-7 bg-white neo-border flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
					<span class="material-symbols-outlined text-base text-on-surface">person</span>
				</div>
				<span class="truncate">Guru: {teacherName}</span>
			</div>

			<div class="font-body-md text-on-surface leading-relaxed mb-4 p-4 bg-surface-container neo-border">
				<MarkdownRenderer content={material.content} />
			</div>

			{#if material.attachments && material.attachments.length > 0}
				<div class="border-t-2 border-on-surface/20 pt-4 mt-4">
					<h4 class="font-label-bold text-sm font-bold mb-3 flex items-center gap-2">
						<span class="material-symbols-outlined">attach_file</span>
						Lampiran File Materi ({material.attachments.length})
					</h4>
					<div class="flex flex-col gap-2">
						{#each material.attachments as att}
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

	<!-- Modal Hapus Materi -->
	{#if showDeleteModal}
		<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
			<div class="bg-surface-container-lowest neo-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full flex flex-col gap-4">
				<h4 class="font-headline-md text-xl font-bold text-error flex items-center gap-2">
					<span class="material-symbols-outlined">warning</span>
					Hapus Materi?
				</h4>
				<p class="font-body-md">Apakah Anda yakin ingin menghapus materi ini? Tindakan ini tidak dapat dibatalkan.</p>
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
{/if}
