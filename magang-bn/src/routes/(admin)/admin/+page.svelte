<script lang="ts">
	import { DashboardWelcome, MetricCard } from "$lib/components/molecules";
	import { ActivityFeed } from "$lib/components/molecules";
	import { Icon, Button } from "$lib/components/atoms";
	import { apiClient } from "$lib/utils/api";
	import { formatFullName } from "$lib/utils/helpers";
	import { onMount } from "svelte";
	import type { PageData } from "./$types";

	let { data } = $props<{ data: PageData }>();

	let stats = $state({
		totalStudents: 0,
		totalTeachers: 0,
		totalMentors: 0,
		totalCompanies: 0,
		totalPlacements: 0,
		activeStudents: 0,
		nonActiveStudents: 0,
	});

	let isRefreshing = $state(false);

	async function fetchDashboard() {
		isRefreshing = true;
		try {
			const res = await apiClient("/dashboard/admin");
			if (res && !res.error && res.data) {
				stats = res.data;
			}
		} catch (e) {
			console.error("Failed to fetch admin dashboard:", e);
		}
		isRefreshing = false;
	}

	onMount(() => {
		fetchDashboard();
	});
</script>

<svelte:head>
	<title>Admin Dashboard | Magang-BN</title>
</svelte:head>

<DashboardWelcome
	title={`SELAMAT DATANG, ${(formatFullName(data.profileData) || "ADMIN").toUpperCase()}!`}
	description="Kelola seluruh data master sistem informasi magang (Prakerin)."
/>

<!-- Section: Pengguna Sistem -->
<div
	class="mt-4 mb-2 animate-fade-in-up flex flex-row items-center justify-between"
	style="animation-delay: 0.1s; animation-fill-mode: both;"
>
	<h2
		class="font-headline font-black text-xs md:text-sm uppercase tracking-tight border-l-4 border-primary pl-2.5"
	>
		Data Pengguna
	</h2>
	<Button variant="secondary" size="sm" onclick={fetchDashboard} disabled={isRefreshing}>
		<Icon name={isRefreshing ? "sync" : "refresh"} class="text-[10px] {isRefreshing ? "animate-spin" : ""}" />
		<span>{isRefreshing ? "Memuat..." : "Refresh"}</span>
	</Button>
</div>
<div
	class="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in-up"
	style="animation-delay: 0.15s; animation-fill-mode: both;"
>
	<MetricCard
		title="Total Murid"
		value={stats.totalStudents}
		icon="school"
		variant="primary"
	/>
	<MetricCard
		title="Total Guru"
		value={stats.totalTeachers}
		icon="person"
		variant="primary"
	/>
	<MetricCard
		title="Total Mentor"
		value={stats.totalMentors}
		icon="badge"
		variant="primary"
	/>
</div>

<!-- Section: Kemitraan & Penempatan -->
<div
	class="mt-4 mb-2 animate-fade-in-up"
	style="animation-delay: 0.2s; animation-fill-mode: both;"
>
	<h2
		class="font-headline font-black text-xs md:text-sm uppercase tracking-tight border-l-4 border-warning pl-2.5"
	>
		Kemitraan & Penempatan
	</h2>
</div>
<div
	class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up"
	style="animation-delay: 0.25s; animation-fill-mode: both;"
>
	<MetricCard
		title="Mitra Industri"
		value={stats.totalCompanies}
		icon="domain"
		variant="warning"
	/>
	<MetricCard
		title="Total Penempatan"
		value={stats.totalPlacements}
		icon="work"
		variant="primary"
	/>
	<MetricCard
		title="Murid Magang Aktif"
		value={stats.activeStudents}
		icon="trending_up"
		variant="success"
	/>
	<MetricCard
		title="Murid Non Magang"
		value={stats.nonActiveStudents}
		icon="pending_actions"
		variant="error"
	/>
</div>

<!-- Admin: Semua Aktivitas Terbaru -->
<ActivityFeed role="admin" />
