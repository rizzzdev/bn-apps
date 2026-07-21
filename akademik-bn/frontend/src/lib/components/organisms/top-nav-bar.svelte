<script lang="ts">
	import { Icon } from '$lib/components/atoms';
	import { onMount } from 'svelte';

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
	<div class="flex items-center gap-2">
		<a
			href="/"
			class="bg-primary text-on-primary px-3 py-1.5 neo-border neo-shadow-sm font-headline-md text-headline-md font-black uppercase tracking-tighter no-underline"
		>
			Akademik-BN
		</a>
	</div>

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
			class="sm:hidden neo-border p-2 hover:bg-surface-container-highest transition-all"
			onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
		>
			<Icon name={isMobileMenuOpen ? 'close' : 'menu'} size="24px" />
		</button>
	</div>
</header>
