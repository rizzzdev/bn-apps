<script lang="ts">
	import { Icon, Button, ActionButton } from '$lib/components/atoms';
	import { Toast, ConfirmationModal, ScoreModal, UploadCertificateModal } from '$lib/components/molecules';
	import AssessmentTable from '$lib/components/molecules/assessment-table.svelte';
	import { onMount, untrack } from 'svelte';
	import { apiClient } from '$lib/utils/api';
	import { page } from '$app/stores';
	
	let searchQuery = $state('');
	let selectedStatus = $state('');
	let selectedStudent = $state('');
	let students = $state<{value: string, label: string}[]>([]);
	
	let currentPage = $state(1);
	let totalPages = $state(1);
	let participants = $state<any[]>([]);
	let loading = $state(true);

	let mentorId = $derived($page.data.profileData?.mentorId || '');

	let showModal = $state(false);
	let selectedPlacement = $state<any>(null);
	let score = $state<number>(0);
	let notes = $state('');

	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success'|'error'>('success');

	let showUploadModal = $state(false);

	let showConfirmModal = $state(false);
	let confirmMessage = $state('');
	let placementToDelete: any = $state(null);

	let statusOptions = [
		{ value: 'Semua Status', label: 'Semua Status' },
		{ value: 'Aktif', label: 'Aktif' },
		{ value: 'Selesai', label: 'Selesai' },
		{ value: 'Batal', label: 'Batal' },
		{ value: 'Berhenti', label: 'Berhenti' }
	];

	async function fetchParticipants(pageNo = 1) {
		loading = true;
		if (mentorId) {
			let url = `/api/v1/internship-placements?mentorId=${mentorId}&page=${pageNo}&limit=10`;
			if (searchQuery || selectedStudent) url += `&search=${encodeURIComponent(searchQuery || selectedStudent)}`;
			if (selectedStatus && selectedStatus !== 'Semua Status') {
				const statusMap: Record<string, string> = { 'Aktif': 'active', 'Selesai': 'completed', 'Batal': 'cancelled', 'Berhenti': 'discontinued' };
				url += `&status=${statusMap[selectedStatus]}`;
			}
			const res = await apiClient(url);
			if (res && !res.error) {
				participants = res.data || [];
				totalPages = res.pagination?.totalPage || 1;
				currentPage = res.pagination?.currentPage || 1;
			}
		}
		loading = false;
	}

	async function fetchStudents() {
		if (mentorId) {
			const res = await apiClient(`/api/v1/internship-placements?mentorId=${mentorId}&limit=1000`);
			if (res && !res.error && res.data) {
				const unique = Array.from(new Map(res.data.map((p: any) => [p.student?.id, p.student?.name])).entries()).map(([id, name]) => ({ value: name as string, label: name as string }));
				students = [{ value: '', label: 'Semua Murid' }, ...unique];
			}
		}
	}

	onMount(() => {
		fetchStudents();
		if (mentorId) fetchParticipants(currentPage);
	});

	$effect(() => {
		if (mentorId) {
			const _ = searchQuery + selectedStatus + selectedStudent + currentPage;
			fetchParticipants(currentPage);
		}
	});

	let debounceTimer: ReturnType<typeof setTimeout>;
	function handleSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => { currentPage = 1; fetchParticipants(1); }, 500);
	}

	function openAssessmentModal(p: any) {
		selectedPlacement = p;
		score = 0;
		notes = '';
		showModal = true;
	}

	async function submitAssessment() {
		if (!selectedPlacement) return;
		const res = await apiClient('/api/v1/assessments', {
			method: 'POST',
			body: JSON.stringify({ placementId: selectedPlacement.id, assessorType: 'industry_mentor', industryMentorId: mentorId, finalScore: Number(score), notes })
		});
		showModal = false;
		if (res && !res.error) {
			toastMessage = 'Penilaian berhasil disimpan!';
			toastType = 'success';
			showToast = true;
			fetchParticipants(currentPage);
		} else {
			toastMessage = res?.message || 'Gagal menyimpan penilaian.';
			toastType = 'error';
			showToast = true;
		}
	}

	function getMentorAssessment(p: any) {
		return p.assessments?.find((a: any) => a.assessorType === 'industry_mentor');
	}

	function openUploadModal(p: any) {
		selectedPlacement = p;
		showUploadModal = true;
	}

	function handleDeleteCertificate(p: any) {
		placementToDelete = p;
		confirmMessage = `Apakah Anda yakin ingin menghapus sertifikat milik ${p.student?.name}?`;
		showConfirmModal = true;
	}

	async function deleteCertificate() {
		const p = placementToDelete;
		if (!p) return;
		
		const assessmentId = getMentorAssessment(p)?.id;
		if (!assessmentId) return;

		const res = await apiClient(`/api/v1/assessments/${assessmentId}/certificate`, {
			method: 'DELETE'
		});

		if (res && !res.error) {
			toastMessage = 'Sertifikat berhasil dihapus!';
			toastType = 'success';
			showToast = true;
			fetchParticipants(currentPage);
		} else {
			toastMessage = res?.message || 'Gagal menghapus sertifikat.';
			toastType = 'error';
			showToast = true;
		}
	}
</script>

<svelte:head>
	<title>Penilaian Praktek | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up">
	<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Evaluasi & Penilaian</h2>
	<p class="font-mono text-secondary mt-1">Berikan evaluasi terhadap performa teknis dan sikap peserta selama magang di perusahaan Anda.</p>
</div>

<AssessmentTable
	{participants}
	{loading}
	{totalPages}
	bind:currentPage
	bind:searchQuery
	onSearch={handleSearch}
	studentOptions={students}
	bind:selectedStudent
	{statusOptions}
	bind:selectedStatus
	variant="mentor"
	onAssess={openAssessmentModal}
	onUploadCertificate={openUploadModal}
	onDeleteCertificate={handleDeleteCertificate}
/>

<ScoreModal
	bind:show={showModal}
	title="Input Nilai Mentor"
	bind:score
	bind:notes
	onsubmit={submitAssessment}
/>

<UploadCertificateModal
	bind:show={showUploadModal}
	studentName={selectedPlacement?.student?.name ?? ''}
	onsubmit={async (file) => {
		const formData = new FormData();
		formData.append('file', file);
		const uploadRes = await apiClient('/api/v1/attachments', { method: 'POST', body: formData });
		if (uploadRes && uploadRes.data && uploadRes.data.url) {
			const assessmentId = getMentorAssessment(selectedPlacement)?.id;
			if (!assessmentId) throw new Error('Data penilaian belum lengkap');
			const updateRes = await apiClient(`/api/v1/assessments/${assessmentId}/certificate`, {
				method: 'PUT',
				body: JSON.stringify({ attachmentId: uploadRes.data.id })
			});
			if (!updateRes || updateRes.error) throw new Error(updateRes?.message || 'Gagal menyimpan link sertifikat');
		} else throw new Error(uploadRes?.message || 'Gagal mengunggah file');
	}}
/>

<ConfirmationModal
	bind:show={showConfirmModal}
	title="Konfirmasi Hapus Sertifikat"
	message={confirmMessage}
	type="danger"
	confirmText="Hapus Sertifikat"
	onConfirm={deleteCertificate}
/>

<Toast bind:show={showToast} type={toastType} message={toastMessage} />
