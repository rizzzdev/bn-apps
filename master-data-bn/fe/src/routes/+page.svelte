<script lang="ts">
	import { Button, Icon } from '$lib/components/atoms';
	import { StatsGrid, QuickActionsPanel } from '$lib/features/dashboard';

</script>

<svelte:head>
	<title>Master-BN Dashboard</title>
</svelte:head>

<header class="mb-lg gap-md flex flex-col justify-between md:flex-row md:items-end">
	<div>
		<h2
			class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-xs tracking-tighter uppercase"
		>
			Dasbor
		</h2>
		<p class="font-body-base text-body-base text-on-surface-variant">
			Ikhtisar sistem manajemen akademik sekolah.
		</p>
	</div>
	<div class="gap-sm flex">
		<Button variant="secondary" href="/student">
			<Icon name="group" class="text-lg" fill={0} /> Data Murid
		</Button>
		<Button variant="secondary" href="/teacher">
			<Icon name="record_voice_over" class="text-lg" fill={0} /> Data Guru
		</Button>
	</div>
</header>

<!-- Stats Bento Grid -->
<StatsGrid />

<!-- Main Content Area: Quick Actions -->
<div class="gap-md grid grid-cols-1">
	<QuickActionsPanel />
</div>
