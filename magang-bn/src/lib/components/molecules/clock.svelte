<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from '../atoms/icon.svelte';
	
	let timeStr = $state('');
	let dateStr = $state('');
	let interval: ReturnType<typeof setInterval>;

	onMount(() => {
		const updateTime = () => {
			const now = new Date();
			
			// Format opsi WIB
			dateStr = now.toLocaleDateString('id-ID', { 
				weekday: 'long', 
				year: 'numeric', 
				month: 'long', 
				day: 'numeric',
				timeZone: 'Asia/Jakarta'
			});
			
			timeStr = now.toLocaleTimeString('id-ID', { 
				hour: '2-digit', 
				minute: '2-digit', 
				second: '2-digit',
				timeZone: 'Asia/Jakarta'
			}) + ' WIB';
		};
		
		updateTime();
		interval = setInterval(updateTime, 1000);
		
		return () => clearInterval(interval);
	});
</script>

<div class="flex items-center gap-1 bg-surface border-2 border-on-background px-3 py-1 shadow-neo-sm" title="Realtime Server Time">
	<Icon name="schedule" class="text-primary text-[10px] hidden sm:block" />
	<div class="flex flex-col items-end sm:items-start justify-center">
		<span class="text-[8px] font-mono font-bold text-secondary uppercase tracking-widest leading-none mb-0.5">
			Waktu Saat Ini
		</span>
		<div class="flex items-center gap-1">
			<span class="text-[10px] font-headline font-bold text-on-background hidden md:inline-block">
				{dateStr}
			</span>
			<span class="text-[8px] font-mono font-bold bg-primary px-1.5 py-0.5 border-2 border-on-background shadow-neo-sm">
				{timeStr || 'Memuat...'}
			</span>
		</div>
	</div>
</div>
