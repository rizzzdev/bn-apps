<script lang="ts">
	import { AcademicYearTable } from '$lib/features/academic-year';
	import { PageHeader } from '$lib/components/molecules';
	import { Button, Icon } from '$lib/components/atoms';

	let isCreateOpen = $state(false);
	let handleExport = $state<() => void>();
</script>

<svelte:head>
	<title>Master-BN - Tahun Ajaran</title>
</svelte:head>

<PageHeader 
	title="Manajemen Tahun Ajaran" 
	description="Kelola kalender akademik, tahun ajaran berjalan, serta konfigurasi semester."
>
	{#snippet actions()}
		<Button variant="primary" class="gap-xs" onclick={() => handleExport?.()}>
			<Icon name="download" class="text-lg" fill={0} />
			Ekspor Data
		</Button>
		<Button variant="secondary" class="gap-xs" onclick={() => isCreateOpen = true}>
			<Icon name="add" class="text-lg" fill={0} />
			Tambah Tahun Ajaran
		</Button>
	{/snippet}
</PageHeader>

<!-- Academic Year Table -->
<AcademicYearTable bind:isCreateOpen bind:handleExport />
