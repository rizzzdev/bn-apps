<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		notifications,
		unreadCount,
		markAllReadPersisted,
		clearAllPersisted,
		type AppNotification,
		loadNotifications
	} from '$lib/stores/notifications';

	let { token = '' }: { token?: string } = $props();

	let isInitialLoad = $state(true);
	let prevUnreadCount = $state(0);

	onMount(() => {
		if (token) {
			void loadNotifications(token).finally(() => {
				isInitialLoad = false;
			});
		} else {
			isInitialLoad = false;
		}
	});

	let open = $state(false);

	$effect(() => {
		const count = $unreadCount;
		// Auto-open only if it's not the initial load and unread count goes up
		if (!isInitialLoad && count > prevUnreadCount) {
			open = true;
		}
		prevUnreadCount = count;
	});

	function toggle() {
		open = !open;
		if (open && token) void markAllReadPersisted(token);
	}

	function handleClear() {
		void clearAllPersisted(token);
	}

	function relativeTime(date: Date): string {
		const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
		if (diff < 60) return `${diff}d lalu`;
		if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
		return `${Math.floor(diff / 86400)}hr lalu`;
	}

	interface IconConfig {
		path: string;
		color: string;
	}

	function getIcon(type: AppNotification['type']): IconConfig {
		switch (type) {
			case 'violation':
				return {
					path: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
					color: 'text-red-500'
				};
			case 'submit':
				return {
					path: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
					color: 'text-green-500'
				};
			case 'score_ready':
				return {
					path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
					color: 'text-green-600'
				};
			case 'exam_scheduled':
				return {
					path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
					color: 'text-blue-500'
				};
			case 'exam_start':
				return {
					path: 'M5 3l14 9-14 9V3z',
					color: 'text-primary-500'
				};
			case 'exam_end':
				return {
					path: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
					color: 'text-(--text-secondary)'
				};
			case 'participant_join':
				return {
					path: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M20 8v6M23 11h-6',
					color: 'text-blue-500'
				};
			case 'participant_disconnect':
				return {
					path: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M23 11h-6',
					color: 'text-amber-500'
				};
			case 'chat':
				return {
					path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
					color: 'text-indigo-500'
				};
			case 'warning':
				return {
					path: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
					color: 'text-orange-500'
				};
			case 'info':
			default:
				return {
					path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8h.01M11 12h1v4h1',
					color: 'text-blue-400'
				};
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-40"
		role="button"
		tabindex="-1"
		aria-label="Tutup notifikasi"
		onclick={() => (open = false)}
		onkeydown={(e) => e.key === 'Escape' && (open = false)}
	></div>
{/if}

<div class="relative">
	<Button variant="secondary" size="icon" onclick={toggle} class="relative" aria-label="Notifikasi">
		{#snippet children()}
			<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
				/>
			</svg>
			{#if $unreadCount > 0}
				<span
					class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1 leading-none"
				>
					{$unreadCount > 99 ? '99+' : $unreadCount}
				</span>
			{/if}
		{/snippet}
	</Button>

	{#if open}
		<div class="absolute right-0 top-full mt-2 w-80 z-50 card overflow-hidden">
			<div class="flex items-center justify-between px-4 py-3 border-b-2 border-(--nb-border)">
				<div class="flex items-center gap-2">
					<span class="font-black text-(--text-primary)">Notifikasi</span>
					<span class="flex items-center gap-1 text-xs text-green-600">
						<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
						Aktif
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onclick={handleClear}
					class="text-xs text-red-500 font-bold hover:underline p-0"
				>
					{#snippet children()}Hapus semua{/snippet}
				</Button>
			</div>

			<div class="max-h-96 overflow-y-auto divide-y divide-(--nb-border)">
				{#if $notifications.length === 0}
					<p class="text-center text-(--text-secondary) text-sm py-8">Belum ada notifikasi.</p>
				{:else}
					{#each $notifications as notif (notif.id)}
						{@const icon = getIcon(notif.type)}
						<div
							class="flex items-start gap-3 px-4 py-3 hover:bg-(--bg-secondary) transition-colors {!notif.read
								? 'bg-(--bg-secondary)/60'
								: ''}"
						>
							<div class="shrink-0 mt-0.5">
								<svg
									class="w-5 h-5 {icon.color}"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d={icon.path} />
								</svg>
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-black text-(--text-primary) leading-tight">{notif.title}</p>
								<p class="text-xs text-(--text-secondary) mt-0.5">{notif.message}</p>
								{#if notif.meta}
									<p class="text-xs text-(--text-secondary) italic truncate mt-0.5">{notif.meta}</p>
								{/if}
								<p class="text-xs text-(--text-secondary) mt-1 opacity-70">
									{relativeTime(notif.timestamp)}
								</p>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
