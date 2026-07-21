<script lang="ts">
	import { Toast } from '$lib/components/molecules';
	import AssessmentTable from '$lib/components/molecules/assessment-table.svelte';
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/utils/api';
	import { PUBLIC_API_URL } from '$env/static/public';

	let searchQuery = $state('');
	let selectedStatus = $state('');
	let selectedCompany = $state('');
	let selectedStudent = $state('');
	let companies = $state<{value: string, label: string}[]>([]);
	let students = $state<{value: string, label: string}[]>([]);
	
	let currentPage = $state(1);
	let totalPages = $state(1);
	let participants = $state<any[]>([]);
	let loading = $state(true);

	let showToast = $state(false);
	let toastMessage = $state('');
	let toastType = $state<'success'|'error'>('success');

	let statusOptions = [
		{ value: 'Semua Status', label: 'Semua Status' },
		{ value: 'Aktif', label: 'Aktif' },
		{ value: 'Selesai', label: 'Selesai' },
		{ value: 'Batal', label: 'Batal' },
		{ value: 'Berhenti', label: 'Berhenti' }
	];

	async function fetchParticipants(pageNo = 1) {
		loading = true;
		let url = `/api/v1/internship-placements?page=${pageNo}&limit=10`;
		if (searchQuery || selectedStudent) url += `&search=${encodeURIComponent(searchQuery || selectedStudent)}`;
		if (selectedStatus && selectedStatus !== 'Semua Status') {
			const statusMap: Record<string, string> = { 'Aktif': 'active', 'Selesai': 'completed', 'Batal': 'cancelled', 'Berhenti': 'discontinued' };
			url += `&status=${statusMap[selectedStatus]}`;
		}
		if (selectedCompany && selectedCompany !== 'Semua Industri') url += `&companyId=${selectedCompany}`;
		const res = await apiClient(url);
		if (res && !res.error) {
			participants = res.data || [];
			totalPages = res.pagination?.totalPage || 1;
			currentPage = res.pagination?.currentPage || 1;
		}
		loading = false;
	}

	async function fetchCompanies() {
		const res = await apiClient('/api/v1/companies');
		if (res && !res.error) {
			companies = [{ value: 'Semua Industri', label: 'Semua Industri' }, ...res.data.map((c: any) => ({ value: c.id, label: c.name }))];
		}
	}

	async function fetchStudents() {
		const res = await apiClient(`/api/v1/internship-placements?limit=1000`);
		if (res && !res.error && res.data) {
			const unique = Array.from(new Map(res.data.map((p: any) => [p.student?.id, p.student?.name])).entries()).map(([id, name]) => ({ value: name as string, label: name as string }));
			students = [{ value: '', label: 'Semua Murid' }, ...unique];
		}
	}

	onMount(() => {
		fetchCompanies();
		fetchStudents();
		fetchParticipants(currentPage);
	});

	$effect(() => {
		const _ = searchQuery + selectedStatus + selectedCompany + selectedStudent + currentPage;
		fetchParticipants(currentPage);
	});

	let debounceTimer: ReturnType<typeof setTimeout>;
	function handleSearch() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => { currentPage = 1; fetchParticipants(1); }, 500);
	}
</script>

<svelte:head>
	<title>Penilaian | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up">
	<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Penilaian Magang</h2>
	<p class="font-mono text-secondary mt-1">Rekapitulasi nilai dan sertifikat kelulusan peserta magang.</p>
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
	companyOptions={companies}
	bind:selectedCompany
	variant="admin"
/>

<Toast bind:show={showToast} type={toastType} message={toastMessage} />
