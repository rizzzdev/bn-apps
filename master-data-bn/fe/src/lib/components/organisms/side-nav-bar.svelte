<script lang="ts">
	import { page } from '$app/stores';
	import { Avatar, Button, Icon, Title } from '$lib/components/atoms';
	import { NavItem } from '$lib/components/molecules';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.svelte';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { apiClient } from '$lib/utils/api';

	import { onMount } from 'svelte';
	let { isOpen = $bindable(false) } = $props<{ isOpen?: boolean }>();

	let isLoggingOut = $state(false);
	let displayName = $state('Admin Utama');
	let displayRole = $state('Administrator Sistem');

	onMount(async () => {
		const user = $page.data.user;
		console.log('user from page data:', user);
		if (user && user.id) {
			try {
				let roleStr = 'Administrator Sistem';
				let url = '';
				
				if (user.roles?.includes('teacher')) {
					url = `/teachers?userId=${user.id}`;
					roleStr = 'Guru';
				} else if (user.roles?.includes('student')) {
					url = `/students?userId=${user.id}`;
					roleStr = 'Murid';
				} else if (user.roles?.includes('super_admin')) {
					url = `/teachers?userId=${user.id}`;
					roleStr = 'Administrator Sistem';
				}

				console.log('fetching url:', url);
				if (url) {
					const res = await apiClient(url);
					
					console.log('fetch res status:', res.status);
					const result = await res.json();
					console.log('fetch result:', result);

					if (result.data && result.data.length > 0) {
						displayName = result.data[0].fullname;
						displayRole = roleStr;
					} else {
						// Fallback to second check if admin role is actually a teacher but not found, or student not found
						// Or just Admin Utama as requested
						displayName = 'Admin Utama';
						displayRole = 'Administrator Sistem';
					}
				}
			} catch (e) {
				console.error('Failed to fetch user profile:', e);
			}
		}
	});

	const handleLogout = async () => {
		isLoggingOut = true;
		try {
			const res = await fetch(`${PUBLIC_API_URL}/auth/logout`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				toast.error(data.message || 'Gagal melakukan logout');
				return;
			}

			toast.success('Berhasil logout');
			localStorage.removeItem('accessToken');
			goto('/login');
		} catch (error) {
			console.error('Logout error:', error);
			toast.error('Terjadi kesalahan saat logout');
		} finally {
			isLoggingOut = false;
		}
	};

	let navGroups = $derived([
		{
			title: 'Menu Utama',
			items: [
				{ href: '/', icon: 'dashboard', label: 'Dasbor', active: $page.url.pathname === '/' }
			]
		},
		{
			title: 'Menu Pengguna dan Peran',
			items: [
				{ href: '/teacher', icon: 'person_4', label: 'Guru', active: $page.url.pathname.startsWith('/teacher') },
				{ href: '/student', icon: 'group', label: 'Murid', active: $page.url.pathname.startsWith('/student') },
				{ href: '/role', icon: 'admin_panel_settings', label: 'Peran', active: $page.url.pathname.startsWith('/role') }
			]
		},
		{
			title: 'Menu Akademik',
			items: [
				{ href: '/major', icon: 'school', label: 'Jurusan', active: $page.url.pathname.startsWith('/major') },
				{ href: '/class', icon: 'door_open', label: 'Kelas', active: $page.url.pathname.startsWith('/class') },
				{ href: '/academic-year', icon: 'calendar_today', label: 'Tahun Ajaran', active: $page.url.pathname.startsWith('/academic-year') },
				{ href: '/subject', icon: 'menu_book', label: 'Mata Pelajaran', active: $page.url.pathname.startsWith('/subject') }
			]
		}
	]);
</script>

<aside
	class="bg-surface border-on-background fixed top-0 left-0 z-40 flex h-screen w-full flex-col border-r-3 transition-transform duration-300 md:w-64 md:translate-x-0 {isOpen ? 'translate-x-0' : '-translate-x-full'}"
>
	<div
		class="h-xl px-md border-on-background bg-surface flex items-center justify-between border-b-3 md:justify-start"
	>
		<Title />
	</div>
	<div class="p-sm flex flex-1 flex-col overflow-y-auto pt-md gap-8 pb-md">
		{#each navGroups as group}
			<div class="flex flex-col relative">
				<div class="flex items-center gap-3 mb-2 px-1 relative z-10">
					<div class="h-3.5 w-3.5 bg-[#FCD34D] border-2 border-on-background shadow-neo-xs rounded-sm"></div>
					<div class="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">
						{group.title}
					</div>
				</div>
				<!-- Vertical connecting line -->
				<div class="flex flex-col gap-2 border-l-3 border-on-background/20 ml-2.5 pl-4 py-1">
					{#each group.items as item}
						<NavItem href={item.href} icon={item.icon} active={item.active}>
							{item.label}
						</NavItem>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<div class="p-md border-on-background bg-primary-container border-t-3">
		<div class="gap-sm flex flex-col">
			<div class="gap-sm flex items-center">
				<Avatar 
					src="https://api.dicebear.com/7.x/notionists/svg?seed=Admin" 
					alt="Profile" 
					size="h-12 w-12" 
					rounded="rounded-full" 
					shadow="shadow-neo-sm" 
				/>
				<div>
					<div class="font-body-bold text-body-bold">{displayName}</div>
					<div class="font-label-sm text-label-sm text-on-surface-variant uppercase">
						{displayRole}
					</div>
				</div>
			</div>
			<Button variant="error" onclick={handleLogout} disabled={isLoggingOut}>
				<Icon name="logout" class="text-lg" />
				{isLoggingOut ? 'Sedang keluar...' : 'Keluar'}
			</Button>
		</div>
	</div>
</aside>
