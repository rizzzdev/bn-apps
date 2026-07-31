<script lang="ts">
	import { Clock } from "../molecules";
	import { Icon, Badge } from "../atoms";
	import { page } from "$app/stores";

	let { isSidebarOpen = $bindable(false) } = $props<{
		isSidebarOpen?: boolean;
	}>();

	let path = $derived($page.url.pathname);
	let subtitle = $derived(() => {
		if (path.startsWith("/admin")) return "Portal Admin";
		if (path.startsWith("/teacher")) return "Portal Guru";
		if (path.startsWith("/student")) return "Portal Murid";
		if (path.startsWith("/mentor")) return "Portal Mentor";
		return "Vocational Portal";
	});
</script>

<header
	class="bg-surface border-b-2 border-on-background shadow-neo-sm flex justify-between items-center px-4 md:px-6 w-full sticky top-0 z-20 h-16"
>
	<!-- Left side: Brand -->
	<div class="flex flex-col items-start justify-center gap-1">
		<!-- Brand for mobile only, since desktop has it on sidebar -->
		<h1
			class="md:hidden text-xl font-headline font-black text-on-background uppercase tracking-tighter leading-none mt-1"
			style="text-shadow: 2px 2px 0px #0f172a; color: var(--color-primary)"
		>
			MAGANG-BN
		</h1>

		<!-- Badge for mobile only -->
		<Badge variant="error" class="w-fit text-[8px] px-1.5 py-px md:hidden"
			>{subtitle()}</Badge
		>
	</div>

	<!-- Right side: Realtime Clock & Hamburger -->
	<div class="flex items-center gap-3">
		<!-- Hamburger for mobile -->
		<button
			class="md:hidden p-1 border-2 border-on-background bg-surface shadow-neo-sm hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all cursor-pointer"
			onclick={() => (isSidebarOpen = !isSidebarOpen)}
			aria-label="Toggle menu"
		>
			<Icon name="menu" class="text-sm text-on-background" />
		</button>

		<!-- Realtime Clock (hidden on mobile) -->
		<div class="hidden md:flex items-center">
			<Clock />
		</div>
	</div>
</header>
