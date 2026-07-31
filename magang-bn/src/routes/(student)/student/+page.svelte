<script lang="ts">
	import { DashboardWelcome, MetricCard } from '$lib/components/molecules';
	import { ActivityFeed } from '$lib/components/molecules';
	import { Icon, Button } from '$lib/components/atoms';
	import { apiClient } from '$lib/utils/api';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { formatFullName } from '$lib/utils/helpers';

	let { data } = $props<{ data: PageData }>();

	let fullName = $derived((formatFullName(data.profileData) || 'MURID').toUpperCase());

	type Metric = { current: number; total: number };

	const DEFAULT_STATS = {
		activeInternships: { current: 0, total: 0 },
		checkInToday: { current: 0, total: 0 },
		checkOutToday: { current: 0, total: 0 },
		approvedLogbooks: { current: 0, total: 0 },
		gradedInternships: { current: 0, total: 0 },
		uploadedCertificates: { current: 0, total: 0 }
	};

	let stats = $state<any>(null);
	let isRefreshing = $state(false);

	const fmt = (m: Metric) => `${m.current}/${m.total}`;

	const s = $derived(stats ?? DEFAULT_STATS);

	onMount(() => {
		if (data.dashboardStats) {
			stats = data.dashboardStats;
		}
	});

	async function fetchDashboard() {
		isRefreshing = true;
		try {
			const email = data.user?.identifiers?.find((i: any) => i.type === 'email')?.value;
			if (email) {
				const res = await apiClient(`/dashboard/student?email=${encodeURIComponent(email)}`);
				if (res && !res.error && res.data) {
					stats = res.data;
				}
			}
		} catch (e) {
			console.error('Failed to fetch student dashboard:', e);
		}
		isRefreshing = false;
	}
</script>

<svelte:head>
	<title>Murid Dashboard | Magang-BN</title>
</svelte:head>

<DashboardWelcome 
	title={`SELAMAT DATANG, ${fullName}!`} 
	description="Pantau aktivitas magang harianmu, dari presensi, pengisian logbook, hingga nilai akhir." 
/>

<div class="flex justify-end mb-2 animate-fade-in-up" style="animation-delay: 0.05s; animation-fill-mode: both;">
	<Button variant="secondary" size="sm" onclick={fetchDashboard} disabled={isRefreshing}>
		<Icon name={isRefreshing ? "sync" : "refresh"} class="text-[10px] {isRefreshing ? "animate-spin" : ""}" />
		<span>{isRefreshing ? "Memuat..." : "Refresh"}</span>
	</Button>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<MetricCard title="Magang Aktif" value={fmt(s.activeInternships)} icon="work" variant="primary" />
	<MetricCard title="Presensi Masuk" value={fmt(s.checkInToday)} icon="login" variant="success" />
	<MetricCard title="Presensi Pulang" value={fmt(s.checkOutToday)} icon="logout" variant="warning" />
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
	<MetricCard title="Logbook Diterima" value={fmt(s.approvedLogbooks)} icon="task_alt" variant="primary" />
	<MetricCard title="Nilai Sudah Diinput" value={fmt(s.gradedInternships)} icon="military_tech" variant="surface" />
	<MetricCard title="Sertifikat Diunggah" value={fmt(s.uploadedCertificates)} icon="verified" variant="success" />
</div>

<div class="mt-5">
	<ActivityFeed role="student" placementId={data.placementId} currentUserId={data.currentUserId} />
</div>
