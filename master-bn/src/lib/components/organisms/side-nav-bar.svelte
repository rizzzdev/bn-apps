<script lang="ts">
	import { page } from '$app/stores';
	import { Avatar, Button, Icon, Title } from '$lib/components/atoms';
	import { NavItem } from '$lib/components/molecules';
	import { toast } from '$lib/stores/toast.svelte';
	import { PUBLIC_PORTAL_URL } from '$env/static/public';
	import { apiClient, getApiBaseUrl } from '$lib/utils/api';

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
			const res = await fetch(`${getApiBaseUrl()}/auth/logout`, {
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
			const portalUrl = PUBLIC_PORTAL_URL || 'http://localhost:5173';
			const portalLoginUrl = portalUrl.endsWith('/login')
				? portalUrl
				: `${portalUrl.replace(/\/+$/, '')}/login`;
			window.location.href = portalLoginUrl;
		} catch (error) {
			console.error('Logout error:', error);
			toast.error('Terjadi kesalahan saat logout');
		} finally {
			isLoggingOut = false;
		}
	};

	interface NavGroupItem {
		href: string;
		icon: string;
		label: string;
		active: boolean;
		external?: boolean;
	}

	interface NavGroup {
		title: string;
		items: NavGroupItem[];
	}

	let navGroups: NavGroup[] = $derived([
		{
			title: 'Menu Utama',
			items: [{ href: '/', icon: 'dashboard', label: 'Dasbor', active: $page.url.pathname === '/' }]
		},
		{
			title: 'Menu Pengguna',
			items: [
				{
					href: '/teacher',
					icon: 'person_4',
					label: 'Guru',
					active: $page.url.pathname.startsWith('/teacher')
				},
				{
					href: '/student',
					icon: 'group',
					label: 'Murid',
					active: $page.url.pathname.startsWith('/student')
				}
			]
		},
		{
			title: 'Menu Akademik',
			items: [
				{
					href: '/major',
					icon: 'school',
					label: 'Jurusan',
					active: $page.url.pathname.startsWith('/major')
				},
				{
					href: '/class',
					icon: 'door_open',
					label: 'Kelas',
					active: $page.url.pathname.startsWith('/class')
				},
				{
					href: '/academic-year',
					icon: 'calendar_today',
					label: 'Tahun Ajaran',
					active: $page.url.pathname.startsWith('/academic-year')
				},
				{
					href: '/subject',
					icon: 'menu_book',
					label: 'Mata Pelajaran',
					active: $page.url.pathname.startsWith('/subject')
				}
			]
		},
		{
			title: 'Menu Lainnya',
			items: [
				{
					href: PUBLIC_PORTAL_URL || 'http://localhost:5173',
					icon: 'apps',
					label: 'Kembali ke Portal',
					active: false,
					external: true
				}
			]
		}
	]);
</script>

{#if isOpen}
	<button
		type="button"
		aria-label="Tutup menu"
		class="fixed inset-0 z-30 bg-black/50 md:hidden transition-opacity cursor-pointer border-none"
		onclick={() => (isOpen = false)}
	></button>
{/if}

<aside
	class="bg-surface border-on-background fixed top-0 left-0 z-40 flex h-screen w-full flex-col border-r-3 transition-transform duration-300 md:w-48 md:translate-x-0 {isOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
>
	<div
		class="h-14 px-3 border-on-background bg-surface flex items-center justify-between border-b-3"
	>
		<Title />
		<Button variant="icon" class="md:hidden" onclick={() => (isOpen = false)}>
			<Icon name="close" class="text-on-surface text-lg" />
		</Button>
	</div>
	<div class="p-2.5 flex flex-1 flex-col overflow-y-auto pt-3 gap-3.5 pb-3">
		{#each navGroups as group (group.title)}
			<div class="flex flex-col relative">
				<div class="flex items-center gap-1.5 mb-1 px-0.5 relative z-10">
					<div
						class="h-2 w-2 bg-[#FCD34D] border-1.5 border-on-background shadow-neo-2xs rounded-xs"
					></div>
					<div
						class="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider font-bold"
					>
						{group.title}
					</div>
				</div>
				<!-- Vertical connecting line -->
				<div class="flex flex-col gap-1 border-l-2 border-on-background/20 ml-1.5 pl-2.5 py-0.5">
					{#each group.items as item (item.href)}
						<NavItem
							href={item.href}
							icon={item.icon}
							active={item.active}
							external={item.external}
							onclick={() => (isOpen = false)}
						>
							{item.label}
						</NavItem>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<div class="p-2.5 border-on-background bg-primary-container border-t-2">
		<div class="gap-2 flex flex-col">
			<div class="gap-2 flex items-center">
				<Avatar
					src="https://api.dicebear.com/7.x/notionists/svg?seed=Admin"
					alt="Profile"
					size="h-8 w-8"
					rounded="rounded-full"
					shadow="shadow-neo-xs"
				/>
				<div class="min-w-0 flex-1">
					<div class="font-body-bold text-[11px] font-bold truncate">{displayName}</div>
					<div class="font-label-sm text-[10px] text-on-surface-variant uppercase truncate">
						{displayRole}
					</div>
				</div>
			</div>
			<Button
				variant="error"
				onclick={handleLogout}
				disabled={isLoggingOut}
				class="!max-w-none w-full justify-center text-xs py-1"
			>
				<Icon name="logout" class="text-xs" />
				{isLoggingOut ? 'Sedang keluar...' : 'Keluar'}
			</Button>
		</div>
	</div>
</aside>
