<script lang="ts">
	import { Icon, Button } from '$lib/components/atoms';
	import { Pagination, SearchFilter, Select, Modal, Toast, LogbookCard } from '$lib/components/molecules';
	import { onMount, untrack } from 'svelte';
	import { apiClient } from '$lib/utils/api';
	import { page } from '$app/stores';
	import type { DailyLogbook } from '$lib/types';

	let {
		variant = 'teacher' as 'teacher' | 'mentor',
	} = $props<{
		variant: 'teacher' | 'mentor';
	}>();

	let loading = $state(true);
	let logbooks = $state<DailyLogbook[]>([]);
	let currentPage = $state(1);
	let totalPages = $state(1);

	let roleId = $derived(
		variant === 'teacher'
			? $page.data.profileData?.teacherId || ''
			: $page.data.profileData?.mentorId || ''
	);
	let idParam = $derived(variant === 'teacher' ? 'teacherId' : 'mentorId');

	let showModal = $state(false);
	let isSubmitting = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error'>('success');

	let selectedLogbook = $state<DailyLogbook | null>(null);
	let actionType = $state<'approved' | 'revision'>('approved');
	let reviewContent = $state('');

	let searchQuery = $state('');
	let selectedStudentId = $state('');
	let selectedStatus = $state('');

	let students = $state<any[]>([]);

	let studentOptions = $derived([
		{ label: '-- Semua Murid --', value: '' },
		...students.map(s => ({ label: `${s.name} (${s.nisn || '-'})`, value: s.id }))
	]);

	let statusOptions = [
		{ label: '-- Semua Status --', value: '' },
		{ label: 'Menunggu', value: 'pending' },
		{ label: 'Disetujui', value: 'approved' }
	];

	async function fetchFiltersData() {
		if (!roleId) return;
		const res = await apiClient(`/api/v1/internship-placements?${idParam}=${roleId}&limit=1000`);
		if (res && !res.error) {
			const uniqueStudents = new Map();
			res.data.forEach((p: any) => {
				if (p.student) uniqueStudents.set(p.student.id, p.student);
			});
			students = Array.from(uniqueStudents.values());
		}
	}

	async function fetchLogbooks(pageNo = 1) {
		loading = true;
		if (roleId) {
			const currentSearch = untrack(() => searchQuery);
			const params = new URLSearchParams({
				[idParam]: roleId,
				page: pageNo.toString(),
				limit: '10'
			});
			if (currentSearch) params.append('search', currentSearch);
			if (selectedStudentId) params.append('studentId', selectedStudentId);
			if (selectedStatus) params.append('status', selectedStatus);

			const res = await apiClient(`/api/v1/daily-logbooks?${params.toString()}`);
			if (res && !res.error) {
				logbooks = res.data || [];
				totalPages = res.pagination?.totalPage || 1;
				currentPage = res.pagination?.currentPage || 1;
			} else {
				logbooks = [];
				totalPages = 1;
			}
		}
		loading = false;
	}

	onMount(() => {
		if (roleId) {
			fetchFiltersData();
		}
	});

	$effect(() => {
		if (roleId) {
			untrack(() => { currentPage = 1; });
			fetchLogbooks(1);
		}
	});

	$effect(() => {
		const _s = selectedStudentId;
		const _st = selectedStatus;
		untrack(() => { currentPage = 1; });
		fetchLogbooks(1);
	});

	$effect(() => {
		const _p = currentPage;
		untrack(() => {
			if (!loading) fetchLogbooks(_p);
		});
	});

	function handleSearch() {
		currentPage = 1;
		fetchLogbooks(1);
	}

	function handleApprove(logbook: DailyLogbook) {
		selectedLogbook = logbook;
		actionType = 'approved';
		reviewContent = '';
		submitReview();
	}

	function handleRevision(logbook: DailyLogbook) {
		selectedLogbook = logbook;
		actionType = 'revision';
		reviewContent = '';
		showModal = true;
	}

	async function submitReview() {
		if (!selectedLogbook) return;
		isSubmitting = true;

		const res = await apiClient(`/api/v1/daily-logbooks/${selectedLogbook.id}/reviews`, {
			method: 'POST',
			body: JSON.stringify({
				action: actionType,
				content: reviewContent || undefined
			})
		});

		isSubmitting = false;

		if (res && !res.error) {
			toastMessage = actionType === 'approved' ? 'Logbook telah disetujui!' : 'Permintaan revisi telah dikirim.';
			toastType = 'success';
			showToast = true;
			showModal = false;
			fetchLogbooks(currentPage);
		} else {
			toastMessage = 'Gagal menyimpan status logbook.';
			toastType = 'error';
			showToast = true;
		}
	}
</script>

<div class="mb-6 relative z-10 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<SearchFilter bind:searchQuery onSearch={handleSearch} placeholder="Cari Judul / Isi Logbook..." />

	<div class="flex flex-col md:flex-row gap-4 mt-4 w-full">
		<div class="w-full md:w-1/2">
			<Select id="studentFilter" options={studentOptions} bind:value={selectedStudentId} searchable={true} placeholder="Semua Murid" />
		</div>
		<div class="w-full md:w-1/2">
			<Select id="statusFilter" options={statusOptions} bind:value={selectedStatus} searchable={false} placeholder="Semua Status" />
		</div>
	</div>
</div>

{#if loading}
	<div class="flex justify-center py-12">
		<Icon name="refresh" class="animate-spin text-4xl text-primary" />
	</div>
{:else if logbooks.length === 0}
	<div class="border-4 border-on-background bg-surface shadow-neo p-12 text-center animate-fade-in-up">
		<Icon name="menu_book" class="text-6xl text-secondary mb-4" />
		<h3 class="font-headline text-2xl font-black uppercase mb-2">Belum Ada Logbook</h3>
		<p class="font-mono text-secondary mb-4">Belum ada logbook dari murid bimbingan yang perlu divalidasi.</p>
	</div>
{:else}
	<div class="space-y-6">
		{#each logbooks as logbook}
			<LogbookCard
				{logbook}
				{variant}
				onApprove={handleApprove}
				onRevision={handleRevision}
			/>
		{/each}
	</div>

	{#if totalPages >= 1}
		<div class="mt-6 flex justify-end animate-fade-in-up">
			<Pagination bind:currentPage {totalPages} />
		</div>
	{/if}
{/if}

<Modal bind:show={showModal} title="Ajukan Revisi">
	<form onsubmit={(e) => { e.preventDefault(); submitReview(); }} class="space-y-6">
		<div class="flex flex-col space-y-2">
			<label for="reviewContent" class="font-headline font-black uppercase text-sm">Catatan Revisi</label>
			<textarea id="reviewContent" rows="4" bind:value={reviewContent} required placeholder="Tuliskan bagian mana yang perlu diperbaiki oleh murid..." class="border-4 border-on-background p-3 focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all font-mono w-full"></textarea>
		</div>

		<div class="flex gap-4">
			<Button type="button" variant="secondary" class="flex-1" onclick={() => showModal = false}>
				Batal
			</Button>
			<Button type="submit" variant="warning" class="flex-1" disabled={isSubmitting}>
				<Icon name={isSubmitting ? "hourglass_empty" : "send"} /> {isSubmitting ? 'Mengirim...' : 'Kirim Revisi'}
			</Button>
		</div>
	</form>
</Modal>

<Toast bind:show={showToast} type={toastType} message={toastMessage} />