<script lang="ts">
	import { LogbookReview } from '$lib/components/molecules';
</script>

<svelte:head>
	<title>Logbook Harian | Magang-BN</title>
</svelte:head>

<div class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-6 animate-fade-in-up">
	<div>
		<h2 class="font-headline text-3xl font-black uppercase tracking-tight">Logbook Harian</h2>
		<p class="font-mono text-secondary mt-1">Evaluasi logbook kegiatan harian yang dikirimkan murid.</p>
	</div>
</div>

<LogbookReview variant="mentor" />