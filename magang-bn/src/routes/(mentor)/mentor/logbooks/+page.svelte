<script lang="ts">
	import { LogbookReview } from '$lib/components/molecules';
</script>

<svelte:head>
	<title>Logbook Harian | Magang-BN</title>
</svelte:head>

<div class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-3 mb-4 animate-fade-in-up">
	<div>
		<h2 class="font-headline text-xl font-black uppercase tracking-tight">Logbook Harian</h2>
		<p class="font-mono text-secondary text-[10px] mt-1">Evaluasi logbook kegiatan harian yang dikirimkan murid.</p>
	</div>
</div>

<LogbookReview variant="mentor" />