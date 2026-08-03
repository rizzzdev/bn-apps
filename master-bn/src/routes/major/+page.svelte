<script lang="ts">
	import { MajorTable } from '$lib/features/major';
	import { PageHeader } from '$lib/components/molecules';
	import { Button, Icon } from '$lib/components/atoms';

	let isCreateOpen = $state(false);
	let handleExport = $state<() => void>();
</script>

<svelte:head>
	<title>Master-BN - Daftar Jurusan</title>
</svelte:head>

<PageHeader
	title="Manajemen Jurusan"
	description="Kelola data program keahlian, kode kompetensi, dan status akreditasi di Master-BN."
>
	{#snippet actions()}
		<Button variant="primary" class="gap-xs" onclick={() => handleExport?.()}>
			<Icon name="download" class="text-lg" fill={0} />
			Ekspor Data
		</Button>
		<Button variant="secondary" class="gap-xs" onclick={() => (isCreateOpen = true)}>
			<Icon name="add" class="text-lg" fill={0} />
			Tambah Jurusan
		</Button>
	{/snippet}
</PageHeader>

<MajorTable bind:isCreateOpen bind:handleExport />
