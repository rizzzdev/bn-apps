<script lang="ts">
	import { DashboardWelcome, MetricCard } from '$lib/components/molecules';
	import { ActivityFeed } from '$lib/components/molecules';
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

	const stats = $derived(data.dashboardStats ?? DEFAULT_STATS);
	const fmt = (m: Metric) => `${m.current}/${m.total}`;
</script>

<svelte:head>
	<title>Murid Dashboard | Magang-BN</title>
</svelte:head>

<DashboardWelcome 
	title={`SELAMAT DATANG, ${fullName}!`} 
	description="Pantau aktivitas magang harianmu, dari presensi, pengisian logbook, hingga nilai akhir." 
/>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 animate-fade-in-up" style="animation-delay: 0.1s; animation-fill-mode: both;">
	<MetricCard title="Magang Aktif" value={fmt(stats.activeInternships)} icon="work" variant="primary" />
	<MetricCard title="Presensi Masuk" value={fmt(stats.checkInToday)} icon="login" variant="success" />
	<MetricCard title="Presensi Pulang" value={fmt(stats.checkOutToday)} icon="logout" variant="warning" />
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
	<MetricCard title="Logbook Diterima" value={fmt(stats.approvedLogbooks)} icon="task_alt" variant="primary" />
	<MetricCard title="Nilai Sudah Diinput" value={fmt(stats.gradedInternships)} icon="military_tech" variant="surface" />
	<MetricCard title="Sertifikat Diunggah" value={fmt(stats.uploadedCertificates)} icon="verified" variant="success" />
</div>

<div class="mt-8">
	<ActivityFeed role="student" placementId={data.placementId} currentUserId={data.currentUserId} />
</div>
