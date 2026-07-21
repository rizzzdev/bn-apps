<script lang="ts">
	import { AttendanceTable } from '$lib/components/molecules';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let currentPage = $state(1);

	let studentOptions = $derived.by(() => {
		const students = new Map();
		students.set('', 'Semua Murid');
		data.attendances.forEach((a) => {
			if (a.student?.name && a.student?.id) {
				students.set(a.student.id, a.student.name);
			}
		});
		return Array.from(students, ([value, label]) => ({ label, value }));
	});

	let selectedStudentId = $state('');

	let totalPages = $derived(Math.ceil(data.attendances.length / 10) || 1);

	let filteredAttendances = $derived.by(() => {
		return data.attendances.filter((a) => {
			const name = a.student?.name || '';
			const company = a.placement?.company?.name || '';
			const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				company.toLowerCase().includes(searchQuery.toLowerCase());
			const matchStudent = !selectedStudentId || a.student?.id === selectedStudentId;
			return matchSearch && matchStudent;
		});
	});

	let paginatedAttendances = $derived(
		filteredAttendances.slice((currentPage - 1) * 10, currentPage * 10)
	);

	$effect(() => {
		searchQuery; selectedStudentId;
		untrack(() => { currentPage = 1; });
	});
</script>

<svelte:head>
	<title>Rekap Presensi Seluruh Murid | Magang-BN</title>
</svelte:head>

<div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in-up">
	<div>
		<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Rekap Presensi Murid</h2>
		<p class="font-mono text-secondary mt-1">Data absensi harian seluruh peserta magang.</p>
	</div>
</div>

<AttendanceTable
	attendances={paginatedAttendances}
	loading={false}
	totalPages={totalPages}
	bind:currentPage
	bind:searchQuery
	onSearch={() => {}}
	studentOptions={studentOptions}
	bind:selectedStudentId
/>