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
		currentTime = now.toLocaleTimeString('id-ID', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		}).replace(/\./g, ':');
		
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
	class="px-md h-xl bg-surface border-on-background sticky top-0 z-50 ml-0 flex w-full md:w-[calc(100%-16rem)] items-center justify-between border-b-3 md:ml-64"
>
	<div class="gap-sm flex items-center">
		<Title class="md:hidden" />
	</div>
	<div class="gap-md flex items-center">
		<!-- Attractive Neo-Brutalist Clock Widget -->
		<div class="hidden md:flex items-center border-2 border-on-background shadow-neo-sm rounded-full overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-neo-md duration-300">
			<!-- Date Section -->
			<div class="bg-primary-container px-4 py-1.5 flex items-center gap-2 border-r-2 border-on-background">
				<Icon name="calendar_today" class="text-on-primary-container text-lg" />
				<span class="font-label-md text-on-primary-container font-bold">{currentDate}</span>
			</div>
			<!-- Time Section -->
			<div class="bg-[#FCD34D] px-4 py-1.5 flex items-center gap-2">
				<Icon name="schedule" class="text-on-background text-lg animate-pulse" />
				<span class="font-display-base text-on-background font-bold tracking-widest">{currentTime}</span>
				<span class="font-label-sm text-on-background bg-surface border-2 border-on-background px-1.5 py-0.5 rounded-sm font-bold text-[10px]">WIB</span>
			</div>
		</div>

		<!-- Hamburger Menu for Mobile -->
		<Button variant="icon" class="md:hidden" onclick={() => (isMenuOpen = !isMenuOpen)}>
			<Icon name={isMenuOpen ? 'close' : 'menu'} class="text-on-surface" />
		</Button>
	</div>
</nav>
