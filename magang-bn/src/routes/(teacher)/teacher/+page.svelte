<script lang="ts">
	import { DashboardWelcome, MetricCard } from "$lib/components/molecules";
	import { ActivityFeed } from "$lib/components/molecules";
	import { Icon, Button } from "$lib/components/atoms";
	import type { PageData } from "./$types";
	import { apiClient } from "$lib/utils/api";
	import { onMount } from "svelte";
	import { formatFullName } from "$lib/utils/helpers";

	let { data } = $props<{ data: PageData }>();

	let fullName = $derived(
		(formatFullName(data.profileData) || "BAPAK/IBU GURU").toUpperCase(),
	);

	type Metric = { current: number; total: number };

	const DEFAULT_STATS = {
		activeStudents: { current: 0, total: 0 },
		checkInToday: { current: 0, total: 0 },
		checkOutToday: { current: 0, total: 0 },
		approvedLogbooks: { current: 0, total: 0 },
		completedAssessments: { current: 0, total: 0 },
	};

	let stats = $state<any>(null);
	let isRefreshing = $state(false);

	async function fetchDashboard() {
		isRefreshing = true;
		const todayStr = new Date()
			.toLocaleString("en-CA", { timeZone: "Asia/Jakarta" })
			.slice(0, 10);
		let url = `/dashboard/teacher?date=${todayStr}`;

		const email = data.user?.identifiers?.find(
			(i: any) => i.type === "email",
		)?.value;
		if (email) {
			url += `&email=${encodeURIComponent(email)}`;
		}

		try {
			const res = await apiClient(url);
			if (res && !res.error) {
				stats = res.data;
			}
		} catch (e) {
			console.error("Failed to fetch teacher dashboard:", e);
		}
		isRefreshing = false;
	}

	onMount(() => {
		fetchDashboard();
	});

	const s = $derived(stats ?? DEFAULT_STATS);
	const fmt = (m: Metric) => `${m.current}/${m.total}`;
</script>

<svelte:head>
	<title>Guru Dashboard | Magang-BN</title>
</svelte:head>

<DashboardWelcome
	title={`SELAMAT DATANG, ${fullName}!`}
	description="Pantau kegiatan siswa magang bimbingan Anda, mulai dari absensi, validasi logbook, hingga penilaian akhir."
/>

<div class="flex justify-end mb-2 animate-fade-in-up" style="animation-delay: 0.05s; animation-fill-mode: both;">
	<Button variant="secondary" size="sm" onclick={fetchDashboard} disabled={isRefreshing}>
		<Icon name={isRefreshing ? "sync" : "refresh"} class="text-[10px] {isRefreshing ? "animate-spin" : ""}" />
		<span>{isRefreshing ? "Memuat..." : "Refresh"}</span>
	</Button>
</div>

<div
	class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 animate-fade-in-up"
	style="animation-delay: 0.1s; animation-fill-mode: both;"
>
	<MetricCard
		title="Peserta Aktif"
		value={fmt(s.activeStudents)}
		icon="badge"
		variant="success"
	/>
	<MetricCard
		title="Logbook Disetujui"
		value={fmt(s.approvedLogbooks)}
		icon="mark_email_unread"
		variant="warning"
	/>
	<MetricCard
		title="Penilaian Diisi"
		value={fmt(s.completedAssessments)}
		icon="fact_check"
		variant="error"
	/>
	<MetricCard
		title="Presensi Masuk"
		value={fmt(s.checkInToday)}
		icon="login"
		variant="success"
	/>
	<MetricCard
		title="Presensi Pulang"
		value={fmt(s.checkOutToday)}
		icon="logout"
		variant="warning"
	/>
</div>

<div class="mt-5">
	<ActivityFeed role="teacher" teacherId={data.teacherId} />
</div>
