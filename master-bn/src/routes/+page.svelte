<script lang="ts">
	import { PageHeader } from '$lib/components/molecules';
	import { Button, Icon } from '$lib/components/atoms';
	import { StatsGrid, QuickActionsPanel } from '$lib/features/dashboard';
</script>

<svelte:head>
	<title>Master-BN Dashboard</title>
</svelte:head>

<PageHeader title="Dasbor" description="Ikhtisar sistem manajemen akademik sekolah.">
	{#snippet actions()}
		<Button
			variant="action"
			href="/student"
			class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
		>
			<Icon name="group" class="text-base" fill={0} /> Data Murid
		</Button>
		<Button
			variant="action"
			href="/teacher"
			class="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
		>
			<Icon name="record_voice_over" class="text-base" fill={0} /> Data Guru
		</Button>
	{/snippet}
</PageHeader>

<!-- Stats Bento Grid -->
<StatsGrid />

<!-- Main Content Area: Quick Actions -->
<div class="gap-md grid grid-cols-1">
	<QuickActionsPanel />
</div>
