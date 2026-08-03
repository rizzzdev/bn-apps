<script lang="ts">
	import { StudentStats, StudentTable } from '$lib/features/student';
	import { PageHeader } from '$lib/components/molecules';
	import { Button, Icon } from '$lib/components/atoms';
	import { apiClient } from '$lib/utils/api';
	import { onMount } from 'svelte';

	let isCreateOpen = $state(false);
	let handleExport = $state<() => void>();

	let stats = $state({
		totalSiswa: 0,
		totalSiswaAktif: 0,
		totalSiswaTidakAktif: 0,
		totalSiswaLulus: 0
	});

	async function fetchStats() {
		try {
			const res = await apiClient('/students/statistic');
			const result = await res.json();
			if (!result.error && result.data) {
				stats = result.data;
			}
		} catch (e) {
			console.error('Failed to fetch stats', e);
		}
	}

	onMount(fetchStats);
</script>

<svelte:head>
	<title>Master-BN - Daftar Murid</title>
</svelte:head>

<PageHeader
	title="Manajemen Murid"
	description="Kelola data pendaftaran, biodata, dan status akademik murid di Master-BN."
>
	{#snippet actions()}
		<Button variant="primary" class="gap-xs" onclick={() => handleExport?.()}>
			<Icon name="download" class="text-lg" fill={0} />
			Ekspor Data
		</Button>
		<Button variant="secondary" class="gap-xs" onclick={() => (isCreateOpen = true)}>
			<Icon name="add" class="text-lg" fill={0} />
			Tambah Murid
		</Button>
	{/snippet}
</PageHeader>

<StudentStats
	totalStudents={stats.totalSiswa}
	activeStudents={stats.totalSiswaAktif}
	inactiveStudents={stats.totalSiswaTidakAktif}
	graduatedStudents={stats.totalSiswaLulus}
/>

<StudentTable bind:isCreateOpen bind:handleExport onDataChange={fetchStats} />
