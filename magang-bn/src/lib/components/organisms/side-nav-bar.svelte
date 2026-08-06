<script lang="ts">
	import { Icon, Badge } from "../atoms";
	import { page } from "$app/stores";
	import { logout, apiClient } from "$lib/utils/api";
	import { getRoleFromPath } from "$lib/constants/roles";

	let { isOpen = $bindable(false) } = $props<{ isOpen?: boolean }>();

	let user = $derived($page.data.user);
	let userEmail = $derived(
		user?.identifiers?.find((i: any) => i.type === "email")?.value ||
			"user@domain.com",
	);

	let profileData = $state<any>($page.data.profileData || null);
	let profileName = $derived(
		profileData?.name && profileData.name !== "Super Admin"
			? profileData.name
			: user?.fullname || "Super Admin",
	);
	let userInitials = $derived.by(() => {
		if (!profileName) return "??";
		const parts = profileName
			.split(" ")
			.filter((w: string) => !w.endsWith("."));
		if (parts.length === 0)
			return profileName.substring(0, 2).toUpperCase();
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	});

	$effect(() => {
		// Only fetch if we don't have profile data from SSR
		if (userEmail && !profileData) {
			apiClient(
				`/dashboard/profile?email=${encodeURIComponent(userEmail)}`,
			)
				.then((res) => {
					if (res && !res.error && res.data) {
						profileData = res.data;
						if (res.data.name && res.data.name !== "Super Admin") {
							profileName = res.data.name;
						}
					}
				})
				.catch((err) => console.error("Failed to fetch profile", err));
		}
	});

	const handleLogout = logout;

	let activeRole = $derived(() => {
		const fromPath = getRoleFromPath($page.url.pathname);
		if (fromPath) return fromPath;

		if (user?.roles) {
			const order = [
				"super_admin",
				"teacher",
				"student",
				"industry_mentor",
			];
			for (const role of order) {
				if (user.roles.includes(role)) return role;
			}
		}
		return "super_admin";
	});

	let navItems = $derived(
		activeRole() === "teacher"
			? [
					{ href: `/teacher`, icon: "dashboard", label: "Dashboard" },
					{
						href: `/teacher/students`,
						icon: "groups",
						label: "Murid Bimbingan",
					},
					{
						href: `/teacher/logbooks`,
						icon: "book",
						label: "Logbook Harian",
					},
					{
						href: `/teacher/attendance`,
						icon: "fact_check",
						label: "Rekap Presensi",
					},
					{
						href: `/teacher/assessment`,
						icon: "grade",
						label: "Penilaian",
					},
				]
			: activeRole() === "student"
				? [
						{
							href: `/student`,
							icon: "dashboard",
							label: "Dashboard",
						},
						{
							href: `/student/logbooks`,
							icon: "edit_document",
							label: "Isi Logbook",
						},
						{
							href: `/student/attendance`,
							icon: "co_present",
							label: "Presensi",
						},
						{
							href: `/student/grades`,
							icon: "military_tech",
							label: "Nilai & Sertifikat",
						},
					]
				: activeRole() === "super_admin"
					? [
							{
								href: `/admin`,
								icon: "dashboard",
								label: "Dashboard",
							},
							{
								href: `/admin/users`,
								icon: "manage_accounts",
								label: "Data Pengguna",
							},
							{
								href: `/admin/companies`,
								icon: "domain",
								label: "Kelola Industri",
							},
							{
								href: `/admin/internship-placements`,
								icon: "map",
								label: "Penempatan",
							},
							{
								href: `/admin/logbooks`,
								icon: "menu_book",
								label: "Rekap Logbook",
							},
							{
								href: `/admin/attendances`,
								icon: "fact_check",
								label: "Rekap Presensi",
							},
							{
								href: `/admin/assessment`,
								icon: "grade",
								label: "Penilaian",
							},
						]
					: activeRole() === "industry_mentor"
						? [
								{
									href: `/mentor`,
									icon: "dashboard",
									label: "Dashboard",
								},
								{
									href: `/mentor/students`,
									icon: "groups",
									label: "Murid Bimbingan",
								},
								{
									href: `/mentor/logbooks`,
									icon: "assignment",
									label: "Logbook Harian",
								},
								{
									href: `/mentor/attendance`,
									icon: "fact_check",
									label: "Rekap Presensi",
								},
								{
									href: `/mentor/assessment`,
									icon: "star",
									label: "Penilaian Praktek",
								},
							]
						: [],
	);

	let subtitle = $derived(() => {
		if (activeRole() === "super_admin") return "Portal Admin";
		if (activeRole() === "teacher") return "Portal Guru";
		if (activeRole() === "student") return "Portal Murid";
		if (activeRole() === "industry_mentor") return "Portal Mentor";
		return "Vocational Portal";
	});
</script>

<aside
	class="bg-surface flex flex-col h-dvh w-44 fixed left-0 top-0 border-r-2 border-on-background shadow-[4px_0px_0px_0px_#0f172a] z-40 py-4 px-2 gap-2 transition-transform duration-300 md:translate-x-0 {isOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
>
	<div class="flex flex-col px-1 mb-1">
		<h1
			class="font-headline text-xl font-black text-on-background uppercase tracking-tighter"
			style="text-shadow: 2px 2px 0px #0f172a; color: var(--color-primary)"
		>
			MAGANG-BN
		</h1>
		<Badge variant="error" class="w-fit text-[8px] px-1.5 py-px"
			>{subtitle()}</Badge
		>
	</div>

	<div class="flex-1 overflow-y-auto overflow-x-hidden mt-2 pb-2">
		<ul class="flex flex-col space-y-0.5 pr-1">
			{#each navItems as item}
				{@const isActive = $page.url.pathname === item.href}
				<li>
					<a
						href={item.href}
						class="flex items-center gap-1.5 px-2 py-1.5 border-2 font-bold transition-all
						{isActive
							? 'bg-primary border-on-background shadow-neo-sm text-on-background'
							: 'border-transparent text-secondary hover:text-on-background hover:bg-slate-100 hover:border-slate-100 hover:shadow-none hover:translate-x-px'}"
					>
						<Icon name={item.icon} class="text-[10px]" />
						<span
							class="font-mono text-[8px] uppercase tracking-wider"
							>{item.label}</span
						>
					</a>
				</li>
			{/each}
		</ul>
	</div>

	<div class="mt-auto pt-2 border-t-2 border-on-background">
		<!-- Combined Profile Card & Logout -->
		<div class="flex flex-col border-2 border-on-background bg-surface">
			<!-- Profile Section -->
			<div class="flex items-center gap-2 p-2 bg-slate-50">
				<!-- Avatar -->
				<div
					class="w-8 h-8 rounded-full border-2 border-on-background bg-primary shrink-0 flex items-center justify-center shadow-[1px_1px_0px_0px_#0f172a]"
				>
					<span class="font-headline font-black text-xs"
						>{userInitials}</span
					>
				</div>
				<!-- User Info -->
				<div class="flex flex-col overflow-hidden">
					<span
						class="font-headline font-black text-[10px] truncate uppercase tracking-tight leading-none"
						>{profileName}</span
					>
					<span
						class="font-mono text-[8px] text-secondary truncate mt-0.5"
						>{userEmail}</span
					>
				</div>
			</div>

			<!-- Role Switcher -->
			{#if user && user.roles && user.roles.length > 1}
				<div
					class="p-1 border-t border-slate-200 bg-slate-100 flex flex-col gap-0.5"
				>
					<span
						class="font-mono text-[6px] text-primary uppercase font-bold px-0.5"
						>Ganti Portal:</span
					>
					<div class="flex flex-wrap gap-0.5">
						{#if user.roles.includes("super_admin")}
							<a
								href="/admin"
								class="px-1 py-0.5 text-[6px] border border-on-background bg-surface font-bold shadow-[1px_1px_0px_0px_#0f172a] hover:bg-primary hover:text-on-background transition-all {activeRole() ===
								'super_admin'
									? 'bg-primary text-on-background opacity-50 cursor-not-allowed'
									: ''}">ADMIN</a
							>
						{/if}
						{#if user.roles.includes("teacher")}
							<a
								href="/teacher"
								class="px-1 py-0.5 text-[6px] border border-on-background bg-surface font-bold shadow-[1px_1px_0px_0px_#0f172a] hover:bg-primary hover:text-on-background transition-all {activeRole() ===
								'teacher'
									? 'bg-primary text-on-background opacity-50 cursor-not-allowed'
									: ''}">GURU</a
							>
						{/if}
						{#if user.roles.includes("student")}
							<a
								href="/student"
								class="px-1 py-0.5 text-[6px] border border-on-background bg-surface font-bold shadow-[1px_1px_0px_0px_#0f172a] hover:bg-primary hover:text-on-background transition-all {activeRole() ===
								'student'
									? 'bg-primary text-on-background opacity-50 cursor-not-allowed'
									: ''}">MURID</a
							>
						{/if}
						{#if user.roles.includes("industry_mentor")}
							<a
								href="/mentor"
								class="px-1 py-0.5 text-[6px] border border-on-background bg-surface font-bold shadow-[1px_1px_0px_0px_#0f172a] hover:bg-primary hover:text-on-background transition-all {activeRole() ===
								'industry_mentor'
									? 'bg-primary text-on-background opacity-50 cursor-not-allowed'
									: ''}">MENTOR</a
							>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Logout Button -->
			<button
				onclick={handleLogout}
				class="flex items-center justify-center gap-1 w-full p-1.5 bg-surface border-t-2 border-on-background text-error hover:bg-error hover:text-surface transition-colors font-bold group cursor-pointer"
			>
				<Icon
					name="logout"
					class="text-[10px] group-hover:-translate-x-px transition-transform"
				/>
				<span class="font-mono text-[8px] uppercase tracking-wider"
					>Keluar</span
				>
			</button>
		</div>
	</div>
</aside>
