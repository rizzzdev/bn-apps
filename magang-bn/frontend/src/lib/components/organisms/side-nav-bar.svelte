<script lang="ts">
	import { Icon, Badge } from '../atoms';
	import { page } from '$app/stores';
	import { PUBLIC_MASTER_API_URL } from '$env/static/public';
	import { getCookie, deleteCookie, apiClient } from '$lib/utils/api';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	
	let { isOpen = $bindable(false) } = $props<{ isOpen?: boolean }>();
	
	let user = $derived($page.data.user);
	let userEmail = $derived(user?.identifiers?.find((i: any) => i.type === 'email')?.value || 'user@domain.com');
	
	let profileData = $state<any>($page.data.profileData || null);
	let profileName = $derived(
		(profileData?.name && profileData.name !== 'Super Admin') 
			? profileData.name 
			: (user?.fullname || 'Super Admin')
	);
	let userInitials = $derived.by(() => {
		if (!profileName) return '??';
		const parts = profileName.split(' ').filter((w: string) => !w.endsWith('.'));
		if (parts.length === 0) return profileName.substring(0, 2).toUpperCase();
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	});

	$effect(() => {
		// Only fetch if we don't have profile data from SSR
		if (userEmail && !profileData) {
			apiClient(`/api/v1/dashboard/profile?email=${encodeURIComponent(userEmail)}`)
			.then(res => {
				if (res && !res.error && res.data) {
					profileData = res.data;
					if (res.data.name && res.data.name !== 'Super Admin') {
						profileName = res.data.name;
					}
				}
			})
			.catch(err => console.error('Failed to fetch profile', err));
		}
	});

	const handleLogout = async () => {
		try {
			const token = getCookie('access_token');
			await fetch(`${PUBLIC_MASTER_API_URL}/api/v1/auth/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(token ? { 'Authorization': `Bearer ${token}` } : {})
				},
				credentials: 'include'
			});
		} catch (error) {
			console.error("Logout failed:", error);
		} finally {
			deleteCookie('access_token');
			deleteCookie('refresh_token');
			toast.success('Berhasil keluar dari sistem');
			goto('/login');
		}
	};
	
	let path = $derived($page.url.pathname);
	let activeRole = $derived(() => {
		if (path.startsWith('/admin')) return 'super_admin';
		if (path.startsWith('/teacher')) return 'teacher';
		if (path.startsWith('/student')) return 'student';
		if (path.startsWith('/mentor')) return 'industry_mentor';

		if (user && user.roles) {
			if (user.roles.includes('super_admin')) return 'super_admin';
			if (user.roles.includes('teacher')) return 'teacher';
			if (user.roles.includes('student')) return 'student';
			if (user.roles.includes('industry_mentor')) return 'industry_mentor';
		}
		return 'super_admin';
	});

	let navItems = $derived(
		activeRole() === 'teacher' ? [
			{ href: `/teacher`, icon: 'dashboard', label: 'Dashboard' },
			{ href: `/teacher/students`, icon: 'groups', label: 'Murid Bimbingan' },
			{ href: `/teacher/logbooks`, icon: 'book', label: 'Logbook Harian' },
			{ href: `/teacher/attendance`, icon: 'fact_check', label: 'Rekap Presensi' },
			{ href: `/teacher/assessment`, icon: 'grade', label: 'Penilaian' }
		] : activeRole() === 'student' ? [
			{ href: `/student`, icon: 'dashboard', label: 'Dashboard' },
			{ href: `/student/logbooks`, icon: 'edit_document', label: 'Isi Logbook' },
			{ href: `/student/attendance`, icon: 'co_present', label: 'Presensi' },
			{ href: `/student/grades`, icon: 'military_tech', label: 'Nilai & Sertifikat' }
		] : activeRole() === 'super_admin' ? [
			{ href: `/admin`, icon: 'dashboard', label: 'Dashboard' },
			{ href: `/admin/users`, icon: 'manage_accounts', label: 'Data Pengguna' },
			{ href: `/admin/companies`, icon: 'domain', label: 'Kelola Industri' },
			{ href: `/admin/internship-placements`, icon: 'map', label: 'Penempatan' },
			{ href: `/admin/logbooks`, icon: 'menu_book', label: 'Rekap Logbook' },
			{ href: `/admin/attendances`, icon: 'fact_check', label: 'Rekap Presensi' },
			{ href: `/admin/assessment`, icon: 'grade', label: 'Penilaian' }
		] : activeRole() === 'industry_mentor' ? [
			{ href: `/mentor`, icon: 'dashboard', label: 'Dashboard' },
			{ href: `/mentor/students`, icon: 'groups', label: 'Murid Bimbingan' },
			{ href: `/mentor/logbooks`, icon: 'assignment', label: 'Logbook Harian' },
			{ href: `/mentor/attendance`, icon: 'fact_check', label: 'Rekap Presensi' },
			{ href: `/mentor/assessment`, icon: 'star', label: 'Penilaian Praktek' }
		] : []
	);
	
	let subtitle = $derived(() => {
		if (activeRole() === 'super_admin') return 'Portal Admin';
		if (activeRole() === 'teacher') return 'Portal Guru';
		if (activeRole() === 'student') return 'Portal Murid';
		if (activeRole() === 'industry_mentor') return 'Portal Mentor';
		return 'Vocational Portal';
	});
</script>

<aside class="bg-surface flex flex-col h-screen w-64 fixed left-0 top-0 border-r-4 border-on-background shadow-[6px_0px_0px_0px_#0f172a] z-40 py-8 px-4 gap-4 transition-transform duration-300 md:translate-x-0 {isOpen ? 'translate-x-0' : '-translate-x-full'}">
	<div class="px-2 mb-6">
		<h1 class="font-headline text-3xl font-black text-on-background uppercase tracking-tighter" style="text-shadow: 2px 2px 0px #0f172a; color: var(--color-primary)">MAGANG-BN</h1>
		<div class="mt-2">
			<Badge variant="error">{subtitle()}</Badge>
		</div>
	</div>
	
	<div class="flex-1 overflow-y-auto overflow-x-hidden mt-4 pb-4">
		<ul class="flex flex-col space-y-2 pr-3">
			{#each navItems as item}
				{@const isActive = $page.url.pathname === item.href}
				<li>
					<a href={item.href} class="flex items-center gap-3 px-4 py-3 border-4 font-bold transition-all
						{isActive 
							? 'bg-primary border-on-background shadow-neo-sm text-on-background' 
							: 'border-transparent text-secondary hover:text-on-background hover:bg-slate-100 hover:border-slate-100 hover:shadow-none hover:translate-x-1'}">
						<Icon name={item.icon} />
						<span class="font-mono text-sm uppercase tracking-wider">{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
	
	<div class="mt-auto pt-4 border-t-4 border-on-background">
		<!-- Combined Profile Card & Logout -->
		<div class="flex flex-col border-4 border-on-background bg-surface">
			<!-- Profile Section -->
			<div class="flex items-center gap-3 p-3 bg-slate-50">
				<!-- Avatar -->
				<div class="w-10 h-10 rounded-full border-2 border-on-background bg-primary shrink-0 flex items-center justify-center shadow-[2px_2px_0px_0px_#0f172a]">
					<span class="font-headline font-black text-sm">{userInitials}</span>
				</div>
				<!-- User Info -->
				<div class="flex flex-col overflow-hidden">
					<span class="font-headline font-black text-sm truncate uppercase tracking-tight leading-none">{profileName}</span>
					<span class="font-mono text-[10px] text-secondary truncate mt-1">{userEmail}</span>
				</div>
			</div>
			
			<!-- Role Switcher -->
			{#if user && user.roles && user.roles.length > 1}
				<div class="p-2 border-t-2 border-slate-200 bg-slate-100 flex flex-col gap-1">
					<span class="font-mono text-[10px] text-primary uppercase font-bold px-1">Ganti Portal:</span>
					<div class="flex flex-wrap gap-1">
						{#if user.roles.includes('super_admin')}
							<a href="/admin" class="px-2 py-1 text-[10px] border-2 border-on-background bg-surface font-bold shadow-[1px_1px_0px_0px_#0f172a] hover:bg-primary hover:text-on-background transition-all {activeRole() === 'super_admin' ? 'bg-primary text-on-background opacity-50 cursor-not-allowed' : ''}">ADMIN</a>
						{/if}
						{#if user.roles.includes('teacher')}
							<a href="/teacher" class="px-2 py-1 text-[10px] border-2 border-on-background bg-surface font-bold shadow-[1px_1px_0px_0px_#0f172a] hover:bg-primary hover:text-on-background transition-all {activeRole() === 'teacher' ? 'bg-primary text-on-background opacity-50 cursor-not-allowed' : ''}">GURU</a>
						{/if}
						{#if user.roles.includes('student')}
							<a href="/student" class="px-2 py-1 text-[10px] border-2 border-on-background bg-surface font-bold shadow-[1px_1px_0px_0px_#0f172a] hover:bg-primary hover:text-on-background transition-all {activeRole() === 'student' ? 'bg-primary text-on-background opacity-50 cursor-not-allowed' : ''}">MURID</a>
						{/if}
						{#if user.roles.includes('industry_mentor')}
							<a href="/mentor" class="px-2 py-1 text-[10px] border-2 border-on-background bg-surface font-bold shadow-[1px_1px_0px_0px_#0f172a] hover:bg-primary hover:text-on-background transition-all {activeRole() === 'industry_mentor' ? 'bg-primary text-on-background opacity-50 cursor-not-allowed' : ''}">MENTOR</a>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Logout Button -->
			<button onclick={handleLogout} class="flex items-center justify-center gap-2 w-full p-3 bg-surface border-t-4 border-on-background text-error hover:bg-error hover:text-surface transition-colors font-bold group cursor-pointer">
				<Icon name="logout" class="group-hover:-translate-x-1 transition-transform" />
				<span class="font-mono text-sm uppercase tracking-wider">Keluar</span>
			</button>
		</div>
	</div>
</aside>

