<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import { onMount } from 'svelte';
	import Title from '../atoms/title.svelte';

	let { isMobileMenuOpen = $bindable(false) } = $props<{
		isMobileMenuOpen?: boolean;
	}>();

	let now = $state(new Date());

	onMount(() => {
		const id = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(id);
	});

	const months = [
		'Januari',
		'Februari',
		'Maret',
		'April',
		'Mei',
		'Juni',
		'Juli',
		'Agustus',
		'September',
		'Oktober',
		'November',
		'Desember'
	];

	function formatDateShort(d: Date) {
		return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
	}

	function formatTime(d: Date) {
		return d.toLocaleTimeString('id-ID', {
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'Asia/Jakarta'
		});
	}
</script>

<header
	class="sticky top-0 z-50 flex justify-between items-center px-gutter bg-surface neo-border-b shadow-[0px_6px_0px_0px_#1C1B1B]"
	style="height: var(--topnav-h)"
>
	<Title />
	<div class="flex items-center gap-3">
		<div
			class="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-container neo-border neo-shadow-sm"
		>
			<Icon name="schedule" size="16px" class="text-primary" />
			<span class="font-label-caps text-label-caps text-on-surface font-bold whitespace-nowrap"
				>{formatDateShort(now)}</span
			>
			<span class="font-label-caps text-label-caps text-primary font-black whitespace-nowrap"
				>{formatTime(now)} WIB</span
			>
		</div>
		<button
			class="sm:hidden relative w-11 h-11 flex items-center justify-center neo-border bg-surface-container-highest shadow-[4px_4px_0px_0px_#1C1B1B] hover:bg-secondary-container transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
			onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
			aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
			aria-expanded={isMobileMenuOpen}
		>
			<span class="relative block w-5 h-4" aria-hidden="true">
				<span
					class="absolute left-0 top-0 h-[3px] w-5 bg-on-surface transition-all duration-300 ease-out {isMobileMenuOpen
						? 'top-1/2 -translate-y-1/2 rotate-45'
						: ''}"
				></span>
				<span
					class="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] w-5 bg-on-surface transition-all duration-200 ease-out {isMobileMenuOpen
						? 'opacity-0 scale-x-0'
						: ''}"
				></span>
				<span
					class="absolute left-0 bottom-0 h-[3px] w-5 bg-on-surface transition-all duration-300 ease-out {isMobileMenuOpen
						? 'bottom-1/2 translate-y-1/2 -rotate-45'
						: ''}"
				></span>
			</span>
		</button>
	</div>
</header>
