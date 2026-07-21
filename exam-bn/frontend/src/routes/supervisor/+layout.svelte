<script lang="ts">
	import { onMount } from 'svelte';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import Notifications from '$lib/components/Notifications.svelte';
	import ChatWidget from '$lib/components/chat/ChatWidget.svelte';
	import { connectSocket } from '$lib/stores/socket';
	import { pushNotification, loadNotifications } from '$lib/stores/notifications';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	let socket = $state<any>(null);

	const menuItems = [
		{
			name: 'Dashboard',
			path: '/supervisor',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
		},
		{
			name: 'Ruangan Saya',
			path: '/supervisor/rooms',
			matchPrefix: '/supervisor/rooms',
			icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
		},
		{
			name: 'Buat Soal',
			path: '/supervisor/questions',
			matchPrefix: '/supervisor/questions',
			icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
		},
		{
			name: 'Koreksi Esai',
			path: '/supervisor/grading',
			matchPrefix: '/supervisor/grading',
			icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
		},
		{
			name: 'Hasil Ujian',
			path: '/supervisor/results',
			matchPrefix: '/supervisor/results',
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
		},
		{
			name: 'Statistik',
			path: '/supervisor/statistics',
			matchPrefix: '/supervisor/statistics',
			icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z'
		},
		{
			name: 'Profil',
			path: '/supervisor/profile',
			icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
		}
	];

	onMount(() => {
		if (!data.token) return;

		void loadNotifications(data.token);

		const s = connectSocket(data.token);
		socket = s;

		// exam:started/exam:ended/violation/etc. are also persisted + pushed live
		// by the backend as generic 'notification' events (see notifyUsers on the
		// backend) — a single listener here avoids showing each one twice.
		s.on('notification', (payload: any) => {
			pushNotification(
				payload.type ?? 'info',
				payload.title ?? 'Pemberitahuan',
				payload.message ?? '',
				payload.meta
			);
		});
	});
</script>

<AppLayout {menuItems} title="Supervisor" user={data.user}>
	{#snippet headerExtra()}
		<Notifications token={data.token ?? ''} />
	{/snippet}
	{@render children()}
</AppLayout>

<ChatWidget
	{socket}
	currentUserId={data.user?.id ?? ''}
	token={data.token ?? ''}
	title="Chat Admin"
	ariaLabel="Chat Admin"
/>
