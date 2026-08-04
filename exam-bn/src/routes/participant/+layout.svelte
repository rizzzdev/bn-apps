<script lang="ts">
	import { onMount } from 'svelte';
	import AppLayout from '$lib/components/AppLayout.svelte';
	import Notifications from '$lib/components/Notifications.svelte';
	import { connectSocket } from '$lib/stores/socket';
	import { pushNotification } from '$lib/stores/notifications';
	import type { LayoutData } from './$types';
	import { examStatus } from '$lib/state/examStatus.svelte';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	const menuItems = [
		{
			name: 'Dashboard',
			path: '/participant',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
		},
		{
			name: 'Ujian Saya',
			path: '/participant/exams',
			matchPrefix: '/participant/exams',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
		},
		{
			name: 'Profil',
			path: '/participant/profile',
			icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
		}
	];

	onMount(() => {
		if (!data.token) return;
		const socket = connectSocket(data.token);
		socket.on('notification', (payload: any) => {
			pushNotification(
				payload.type ?? 'info',
				payload.title ?? 'Pemberitahuan',
				payload.message ?? '',
				payload.meta
			);
		});
	});
</script>

<AppLayout {menuItems} title="Peserta" user={data.user}>
	{#snippet headerExtra()}
		<Notifications />
	{/snippet}

	{#if examStatus.isOffline}
		<div
			class="bg-red-500 text-white text-sm font-bold p-3 text-center mb-4 flex justify-center items-center gap-2 shadow-md"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
				><path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m1.414 1.414a7 7 0 019.9 0m-9.9 9.9a7 7 0 010-9.9m2.828 2.828a3 3 0 014.242 0m-4.242 4.242a3 3 0 010-4.242"
				/></svg
			>
			Koneksi Terputus. Pastikan internet Anda stabil untuk menyimpan jawaban.
		</div>
	{/if}

	{@render children()}
</AppLayout>
