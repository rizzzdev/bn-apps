<script lang="ts">
	import { Icon, Button, ActionButton } from '$lib/components/atoms';
	import { FormField, Toast, Modal } from '$lib/components/molecules';
	import { apiClient } from '$lib/utils/api';
	import { formatFullName } from '$lib/utils/helpers';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	
	let showToast = $state(false);
	let toastMessage = $state('');
	let isSubmitting = $state(false);
	let isError = $state(false);
	
	let placementId = $state('');
	let placements: any[] = $state([]);
	let isLoadingPlacements = $state(true);
	
	let showModal = $state(false);

	let date = $state(new Date().toISOString().split('T')[0]);
	let activityTitle = $state('');
	let description = $state('');
	
	let attachments = $state<File[]>([]);
	let fileInput = $state<HTMLInputElement | null>(null);

	// formatName diganti dengan formatFullName dari helpers
	
	function formatDateRange(start: string, end: string) {
		if (!start || !end) return '-';
		const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
		const s = new Date(start).toLocaleDateString('id-ID', options);
		const e = new Date(end).toLocaleDateString('id-ID', options);
		return `${s} - ${e}`;
	}

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
	
	function openLogbookModal(id: string) {
		placementId = id;
		showModal = true;
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) {
			const newFiles = Array.from(target.files);
			// Validate 5MB limit
			const invalidFiles = newFiles.filter(f => f.size > 5 * 1024 * 1024);
			if (invalidFiles.length > 0) {
				toastMessage = 'Beberapa file gagal ditambahkan karena melebihi batas 5MB.';
				showToast = true;
				isError = true;
			}
			const validFiles = newFiles.filter(f => f.size <= 5 * 1024 * 1024);
			attachments = [...attachments, ...validFiles];
		}
		if (fileInput) fileInput.value = '';
	}

	function removeFile(index: number) {
		attachments = attachments.filter((_, i) => i !== index);
	}

	function formatBytesToMB(bytes: number) {
		return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!placementId) {
			isError = true;
			toastMessage = "Tidak ada penempatan magang aktif yang dipilih!";
			showToast = true;
			return;
		}

		isSubmitting = true;
		
		const formData = new FormData();
		formData.append('placementId', placementId);
		formData.append('date', new Date(date).toISOString());
		formData.append('activityTitle', activityTitle);
		if (description) formData.append('description', description);
		
		attachments.forEach(file => {
			formData.append('attachments', file);
		});

		const res = await apiClient('/api/v1/daily-logbooks', {
			method: 'POST',
			body: formData
		});

		isSubmitting = false;

		if (res && !res.error) {
			isError = false;
			toastMessage = "Logbook berhasil dikirim untuk di-review!";
			showToast = true;
			showModal = false;
			// Reset form
			activityTitle = '';
			description = '';
			attachments = [];
		} else {
			isError = true;
			toastMessage = res?.message || "Gagal menyimpan logbook!";
			showToast = true;
		}
	}
</script>

<svelte:head>
	<title>Isi Logbook | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up">
	<div class="flex justify-between items-center">
		<div>
			<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Logbook Harian</h2>
			<p class="font-mono text-secondary mt-1">Catat aktivitas magangmu hari ini dengan detail.</p>
		</div>
		<Button variant="secondary" href="/student/logbooks/recap">
			<Icon name="history" /> Lihat Recap Logbook
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
					class="text-left flex flex-col justify-between border-4 border-on-background p-6 bg-surface transition-all hover:-translate-y-1 hover:shadow-neo-sm"
					onclick={() => openLogbookModal(placement.id)}
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
{/if}

<Modal bind:show={showModal} title="Tulis Logbook Harian">
	<form onsubmit={handleSubmit} class="space-y-6">
		<div class="flex flex-col space-y-2">
			<label for="date" class="font-headline font-black uppercase text-sm">Tanggal</label>
			<input id="date" type="date" bind:value={date} required class="border-4 border-on-background p-3 focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all font-mono font-bold bg-surface w-full" />
		</div>
		
		<div class="flex flex-col space-y-2">
			<label for="activityTitle" class="font-headline font-black uppercase text-sm">Judul Kegiatan</label>
			<input id="activityTitle" type="text" bind:value={activityTitle} placeholder="Contoh: Instalasi Jaringan" required class="border-4 border-on-background p-3 focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all font-mono font-bold bg-surface w-full" />
		</div>
		
		<div class="flex flex-col space-y-2">
			<label for="description" class="font-headline font-black uppercase text-sm">Deskripsi Kegiatan</label>
			<textarea id="description" rows="5" bind:value={description} class="border-4 border-on-background p-3 focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all font-mono w-full" placeholder="Ceritakan detail aktivitas magang hari ini..."></textarea>
		</div>
		
		<div class="flex flex-col space-y-2">
			<span class="font-headline font-black uppercase text-sm">File Pendukung (Lampiran)</span>
			
			{#if attachments.length > 0}
				<div class="mb-4 space-y-2">
					{#each attachments as file, i}
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
							<ActionButton variant="error" icon="delete" label="Hapus File" onclick={() => removeFile(i)} />
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
			<Icon name={isSubmitting ? "hourglass_empty" : "save"} /> {isSubmitting ? 'Menyimpan...' : 'Simpan Logbook'}
		</Button>
	</form>
</Modal>

<Toast bind:show={showToast} type={isError ? "error" : "success"} message={toastMessage} />
