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

<div class="flex items-center gap-3 bg-surface border-4 border-on-background px-4 py-2 shadow-neo-sm" title="Realtime Server Time">
	<Icon name="schedule" class="text-primary text-2xl hidden sm:block" />
	<div class="flex flex-col items-end sm:items-start justify-center">
		<span class="text-[10px] font-mono font-bold text-secondary uppercase tracking-widest leading-none mb-1">
			Waktu Saat Ini
		</span>
		<div class="flex items-center gap-2">
			<span class="text-sm font-headline font-bold text-on-background hidden md:inline-block">
				{dateStr}
			</span>
			<span class="text-xs font-mono font-bold bg-primary px-2 py-0.5 border-2 border-on-background shadow-neo-sm">
				{timeStr || 'Memuat...'}
			</span>
		</div>
	</div>
</div>
