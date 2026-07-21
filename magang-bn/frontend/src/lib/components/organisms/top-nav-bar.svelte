<script lang="ts">
	import { Clock } from '../molecules';
	import { Icon, Badge } from '../atoms';
	import { page } from '$app/stores';
	
	let { isSidebarOpen = $bindable(false) } = $props<{ isSidebarOpen?: boolean }>();

	let path = $derived($page.url.pathname);
	let subtitle = $derived(() => {
		if (path.startsWith('/admin')) return 'Portal Admin';
		if (path.startsWith('/teacher')) return 'Portal Guru';
		if (path.startsWith('/student')) return 'Portal Murid';
		if (path.startsWith('/mentor')) return 'Portal Mentor';
		return 'Vocational Portal';
	});
</script>

<header class="bg-surface border-b-4 border-on-background shadow-neo-sm flex justify-between items-center px-4 md:px-8 w-full sticky top-0 z-20 h-24">
	<!-- Left side: Brand -->
	<div class="flex flex-col items-start justify-center gap-1">
		<!-- Brand for mobile only, since desktop has it on sidebar -->
		<h1 class="md:hidden font-headline text-2xl font-black text-on-background uppercase tracking-tighter leading-none mt-1" style="text-shadow: 2px 2px 0px #0f172a; color: var(--color-primary)">MAGANG-BN</h1>
		
		<!-- Badge for mobile only -->
		<div class="md:hidden">
			<Badge variant="error">{subtitle()}</Badge>
		</div>
	</div>
	
	<!-- Right side: Realtime Clock & Hamburger -->
	<div class="flex items-center gap-4">
		<!-- Hamburger for mobile -->
		<button 
			class="md:hidden p-2 border-4 border-on-background bg-surface shadow-neo-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-pointer"
			onclick={() => isSidebarOpen = !isSidebarOpen}
			aria-label="Toggle menu"
		>
			<Icon name="menu" class="text-2xl text-on-background" />
		</button>

		<!-- Realtime Clock (hidden on mobile) -->
		<div class="hidden md:flex items-center">
			<Clock />
		</div>
	</div>
</header>
