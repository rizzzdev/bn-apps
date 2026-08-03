<script lang="ts">
	import { ClassTable } from '$lib/features/class';
	import { PageHeader } from '$lib/components/molecules';
	import { Button, Icon } from '$lib/components/atoms';

	let isCreateOpen = $state(false);
	let handleExport = $state<() => void>();
</script>

<svelte:head>
	<title>Master-BN - Daftar Kelas</title>
</svelte:head>

<PageHeader
	title="Manajemen Kelas"
	description="Kelola data kelas, jurusan, wali kelas, dan kapasitas ruangan di Master-BN."
>
	{#snippet actions()}
		<Button variant="primary" class="gap-xs" onclick={() => handleExport?.()}>
			<Icon name="download" class="text-lg" fill={0} />
			Ekspor Data
		</Button>
		<Button variant="secondary" class="gap-xs" onclick={() => (isCreateOpen = true)}>
			<Icon name="add" class="text-lg" fill={0} />
			Tambah Kelas
		</Button>
	{/snippet}
</PageHeader>

<ClassTable bind:isCreateOpen bind:handleExport />
