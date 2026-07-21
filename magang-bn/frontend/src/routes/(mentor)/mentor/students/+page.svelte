<script lang="ts">
	import { StudentsTable } from '$lib/components/molecules';
	import { apiClient } from '$lib/utils/api';
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/stores';

	let currentPage = $state(1);
	let totalPages = $state(1);
	let students = $state<any[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');

	let mentorId = $derived($page.data.profileData?.mentorId || '');

	async function fetchStudents(pageNo = 1) {
		loading = true;
		if (mentorId) {
			const currentSearch = untrack(() => searchQuery);
			const searchParam = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : "";
			const res = await apiClient(`/api/v1/internship-placements?mentorId=${mentorId}&page=${pageNo}&limit=10${searchParam}`);
			if (res && !res.error) {
				students = res.data || [];
				totalPages = res.pagination?.totalPage || 1;
				currentPage = res.pagination?.currentPage || 1;
			}
		}
		loading = false;
	}

	onMount(() => {
		if (mentorId) fetchStudents(currentPage);
	});

	$effect(() => {
		if (mentorId) fetchStudents(currentPage);
	});
</script>

<svelte:head>
	<title>Murid Bimbingan | Magang-BN</title>
</svelte:head>

<div class="mb-6 animate-fade-in-up">
	<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Murid Bimbingan</h2>
	<p class="font-mono text-secondary mt-1">Daftar murid magang di bawah bimbingan Anda.</p>
</div>

<StudentsTable
	placements={students}
	{loading}
	{totalPages}
	bind:currentPage
	bind:searchQuery
	onSearch={() => { currentPage = 1; fetchStudents(1); }}
/>
