<script lang="ts">
	import { SubjectTable } from '$lib/features/subject';
	import { PageHeader } from '$lib/components/molecules';
	import { Button, Icon } from '$lib/components/atoms';

	let isCreateOpen = $state(false);
	let handleExport = $state<() => void>();
</script>

<svelte:head>
	<title>Master-BN - Daftar Mata Pelajaran</title>
</svelte:head>

<PageHeader 
	title="Manajemen Mata Pelajaran" 
	description="Kelola data mata pelajaran, kode, dan jam pelajaran di Master-BN."
>
	{#snippet actions()}
		<Button variant="primary" class="gap-xs" onclick={() => handleExport?.()}>
			<Icon name="download" class="text-lg" fill={0} />
			Ekspor Data
		</Button>
		<Button variant="secondary" class="gap-xs" onclick={() => isCreateOpen = true}>
			<Icon name="add" class="text-lg" fill={0} />
			Tambah Mata Pelajaran
		</Button>
	{/snippet}
</PageHeader>

<SubjectTable bind:isCreateOpen bind:handleExport />
