<script lang="ts">
	import { Button, Icon, Title } from '$lib/components/atoms';
	import { onMount, onDestroy } from 'svelte';

	let { isMenuOpen = $bindable(false) } = $props<{ isMenuOpen?: boolean }>();

	let currentTime = $state('00:00:00');
	let currentDate = $state('Memuat...');
	let timer: ReturnType<typeof setInterval>;

	const updateTime = () => {
		const now = new Date();
		// Format Time
		currentTime = now
			.toLocaleTimeString('id-ID', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false
			})
			.replace(/\./g, ':');

		// Format Date
		currentDate = now.toLocaleDateString('id-ID', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	};

	onMount(() => {
		updateTime();
		timer = setInterval(updateTime, 1000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

<nav
	class="fixed top-0 left-0 right-0 md:left-48 z-30 px-3.5 h-14 bg-surface border-on-background flex items-center justify-between border-b-3 transition-all duration-300"
>
	<div class="gap-sm flex items-center">
		<Title class="md:hidden" />
	</div>
	<div class="gap-md flex items-center">
		<!-- Compact Neo-Brutalist Clock/Date Widget -->
		<div
			class="hidden md:flex items-center border-2 border-on-background shadow-neo-2xs rounded-full overflow-hidden"
		>
			<!-- Date Section -->
			<div class="bg-surface px-2 py-0.5 flex items-center gap-1 border-r-2 border-on-background">
				<Icon name="calendar_today" class="text-on-surface text-xs" />
				<span class="font-label-sm text-on-surface text-xs font-bold">{currentDate}</span>
			</div>
			<!-- Time Section -->
			<div class="bg-[#FCD34D] px-2 py-0.5 flex items-center gap-1">
				<Icon name="schedule" class="text-on-background text-xs animate-pulse" />
				<span class="font-display-base text-on-background text-xs font-bold tracking-wider"
					>{currentTime}</span
				>
				<span
					class="font-label-sm text-on-background bg-surface border border-on-background px-1 rounded-2xs font-bold text-[8px]"
					>WIB</span
				>
			</div>
		</div>

		<!-- Hamburger Menu for Mobile -->
		<Button variant="icon" class="md:hidden" onclick={() => (isMenuOpen = !isMenuOpen)}>
			<Icon name={isMenuOpen ? 'close' : 'menu'} class="text-on-surface" />
		</Button>
	</div>
</nav>
