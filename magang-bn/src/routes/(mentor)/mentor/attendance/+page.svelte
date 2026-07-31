<script lang="ts">
	import { AttendanceTable } from "$lib/components/molecules";
	import { apiClient } from "$lib/utils/api";
	import { onMount, untrack } from "svelte";
	import { page } from "$app/stores";

	let currentPage = $state(1);
	let totalPages = $state(1);
	let attendances = $state<any[]>([]);
	let loading = $state(true);

	let mentorId = $derived($page.data.profileData?.mentorId || "");

	let searchQuery = $state("");
	let selectedStudentId = $state("");
	let students = $state<any[]>([]);

	let studentOptions = $derived([
		{ label: "-- Semua Murid --", value: "" },
		...students.map((s) => ({
			label: `${s.name} (${s.nisn || "-"})`,
			value: s.id,
		})),
	]);

	async function fetchFiltersData() {
		if (!mentorId) return;
		const res = await apiClient(
			`/internship-placements?mentorId=${mentorId}&limit=1000`,
		);
		if (res && !res.error) {
			const uniqueStudents = new Map();
			res.data.forEach((p: any) => {
				if (p.student) uniqueStudents.set(p.student.id, p.student);
			});
			students = Array.from(uniqueStudents.values());
		}
	}

	async function fetchAttendances(pageNo = 1) {
		loading = true;
		if (mentorId) {
			const currentSearch = untrack(() => searchQuery);
			const params = new URLSearchParams({
				mentorId: mentorId,
				page: pageNo.toString(),
				limit: "10",
			});
			if (currentSearch) params.append("search", currentSearch);
			if (selectedStudentId)
				params.append("studentId", selectedStudentId);

			const res = await apiClient(`/attendances?${params.toString()}`);
			if (res && !res.error) {
				attendances = res.data || [];
				totalPages = res.pagination?.totalPage || 1;
				currentPage = res.pagination?.currentPage || 1;
			} else {
				attendances = [];
				totalPages = 1;
			}
		}
		loading = false;
	}

	onMount(() => {
		if (mentorId) {
			fetchFiltersData();
			fetchAttendances(currentPage);
		}
	});

	$effect(() => {
		const _s = selectedStudentId;
		currentPage = 1;
		fetchAttendances(1);
	});

	$effect(() => {
		const _p = currentPage;
		untrack(() => {
			if (!loading) fetchAttendances(_p);
		});
	});

	function handleSearch() {
		currentPage = 1;
		fetchAttendances(1);
	}
</script>

<svelte:head>
	<title>Rekap Presensi | Magang-BN</title>
</svelte:head>

<div
	class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-3 mb-4 animate-fade-in-up"
>
	<div>
		<h2 class="font-headline text-xl font-black uppercase tracking-tight">
			Rekap Presensi
		</h2>
		<p class="font-mono text-secondary text-[10px] mt-1">
			Pantau presensi masuk dan pulang murid beserta titik lokasinya.
		</p>
	</div>
</div>

<AttendanceTable
	{attendances}
	{loading}
	{totalPages}
	bind:currentPage
	bind:searchQuery
	onSearch={handleSearch}
	{studentOptions}
	bind:selectedStudentId
/>
