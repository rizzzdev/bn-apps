<script lang="ts">
	import { authState } from '$lib/features/auth/auth.svelte';
	import Title from '$lib/components/Title.svelte';

	let { onToggleSidebar = () => {} } = $props<{ onToggleSidebar?: () => void }>();

	let role = $derived(authState.user?.role || 'student');

	// ─── WIB Clock & Date ──────────────────────────
	let dateTimeStr = $state('');
	let clockInterval: ReturnType<typeof setInterval> | undefined;

	function updateClock() {
		const now = new Date();
		const time = now.toLocaleTimeString('id-ID', {
			timeZone: 'Asia/Jakarta',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		});
		const date = now.toLocaleDateString('id-ID', {
			timeZone: 'Asia/Jakarta',
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
		dateTimeStr = `${date} — ${time} WIB`;
	}

	$effect(() => {
		updateClock();
		clockInterval = setInterval(updateClock, 1000);
		return () => clearInterval(clockInterval);
	});

	function handleToggle() {
		onToggleSidebar();
	}
</script>

<header
	class="bg-surface flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 sticky top-0 z-30 border-b-2 border-on-surface shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]"
>
	<!-- Left: Logo (mobile only) -->
	<div class="flex items-center gap-2 md:hidden">
		<Title />
		<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-label-bold uppercase tracking-wider border-2 border-on-surface shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-[#adff2f] text-on-surface">
			{role === 'teacher' ? 'Guru' : 'Murid'}
		</span>
	</div>

	<!-- Spacer on mobile, left spacer on desktop -->
	<div class="hidden md:block"></div>

	<!-- Right side -->
	<div class="flex items-center gap-3">
		<!-- Desktop: WIB Clock & Date -->
		<div class="hidden md:flex items-center gap-2 bg-surface-container neo-border px-3 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
			<span class="material-symbols-outlined text-xs text-secondary">schedule</span>
			<span class="font-label-bold text-xs tracking-wider">{dateTimeStr}</span>
		</div>

		<!-- Mobile: Hamburger -->
		<button
			class="md:hidden p-2 text-on-surface neo-border shadow-[2px_2px_0px_0px_rgba(26,28,28,1)] bg-white active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
			onclick={handleToggle}
		>
			<span class="material-symbols-outlined">menu</span>
		</button>
	</div>
</header>
