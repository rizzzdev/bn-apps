<script lang="ts">
	import { TeacherStats, TeacherTable } from '$lib/features/teacher';
	import { PageHeader } from '$lib/components/molecules';
	import { Button, Icon } from '$lib/components/atoms';
	import { apiClient } from '$lib/utils/api';
	import { onMount } from 'svelte';

	let isCreateOpen = $state(false);
	let handleExport = $state<() => void>();

	let stats = $state({
		total: 0,
		active: 0,
		inactive: 0,
		retired: 0
	});

	onMount(async () => {
		try {
			const res = await apiClient('/teachers/statistics');
			const result = await res.json();
			if (!result.error && result.data) {
				stats = result.data;
			}
		} catch (e) {
			console.error('Failed to fetch stats', e);
		}
	});
</script>

<svelte:head>
	<title>Master-BN - Daftar Guru</title>
</svelte:head>

<PageHeader 
	title="Manajemen Guru" 
	description="Kelola data tenaga pendidik, penugasan, dan status keaktifan di Master-BN."
>
	{#snippet actions()}
		<Button variant="primary" class="gap-xs" onclick={() => handleExport?.()}>
			<Icon name="download" class="text-lg" fill={0} />
			Ekspor Data
		</Button>
		<Button variant="secondary" class="gap-xs" onclick={() => isCreateOpen = true}>
			<Icon name="add" class="text-lg" fill={0} />
			Tambah Guru
		</Button>
	{/snippet}
</PageHeader>

<TeacherStats 
	totalTeachers={stats.total} 
	activeTeachers={stats.active} 
	inactiveTeachers={stats.inactive} 
	retiredTeachers={stats.retired}
/>

<TeacherTable bind:isCreateOpen bind:handleExport />
