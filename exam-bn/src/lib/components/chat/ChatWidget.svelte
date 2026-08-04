<script lang="ts">
	import { onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { resolveBackendUrl } from '$lib/utils/backend-url';
	import {
		chatConversations,
		activeChatUserId,
		type ChatMessage,
		type ReplyPreview
	} from '$lib/stores/chat';
	import ChatHeader from '$lib/components/chat/ChatHeader.svelte';
	import ChatBubble from '$lib/components/chat/ChatBubble.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ChatToggleButton from '$lib/components/chat/ChatToggleButton.svelte';

	const API_BASE = resolveBackendUrl() + '/api/v1';

	let {
		socket,
		currentUserId,
		token = '',
		title = 'Chat',
		ariaLabel = 'Chat'
	}: {
		socket: any;
		currentUserId: string;
		token?: string;
		title?: string;
		ariaLabel?: string;
	} = $props();

	type ConversationSummary = {
		otherUserId: string;
		otherUserName: string;
		otherUserRole: string;
		lastMessage: string;
		lastAt: string | null;
		unreadCount: number;
	};
	type Contact = { id: string; fullname: string; username: string; role: string };

	let open = $state(false);
	let view = $state<'list' | 'chat' | 'contacts'>('list');
	let text = $state('');
	let messagesEl = $state<HTMLDivElement | null>(null);
	let loadingList = $state(false);
	let loadingContacts = $state(false);
	let serverConversations = $state<ConversationSummary[]>([]);
	let contacts = $state<Contact[]>([]);
	let replyingTo = $state<ReplyPreview | null>(null);

	let conversations = $state<Record<string, any>>({});
	let activeId = $state<string | null>(null);
	const unsubConversations = chatConversations.subscribe((v) => {
		conversations = v;
	});
	const unsubActive = activeChatUserId.subscribe((v) => {
		activeId = v;
	});

	onDestroy(() => {
		unsubConversations();
		unsubActive();
	});

	const activeConversation = $derived(
		activeId && conversations[activeId] ? conversations[activeId] : null
	);

	// Access token is short-lived (15min). If it expired since the last full
	// page navigation, retry once after forcing a layout reload (which
	// refreshes the access token via the refresh_token cookie).
	async function authFetch(url: string): Promise<Response> {
		const doFetch = () =>
			fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
		let res = await doFetch();
		if (res.status === 401) {
			await invalidateAll();
			res = await doFetch();
		}
		return res;
	}

	async function fetchConversations() {
		loadingList = true;
		try {
			const res = await authFetch(`${API_BASE}/chats/conversations`);
			if (res.ok) serverConversations = (await res.json()).data ?? [];
		} catch {
			/* ignore */
		} finally {
			loadingList = false;
		}
	}

	async function fetchContacts() {
		loadingContacts = true;
		try {
			const res = await authFetch(`${API_BASE}/chats/contacts`);
			if (res.ok) contacts = (await res.json()).data ?? [];
		} catch {
			/* ignore */
		} finally {
			loadingContacts = false;
		}
	}

	$effect(() => {
		if (token) void fetchConversations();
	});

	function updateSummaryFromMessage(
		otherUserId: string,
		otherUserName: string,
		otherUserRole: string,
		message: string,
		lastAt: string,
		viewingThis: boolean
	) {
		const existing = serverConversations.find((c) => c.otherUserId === otherUserId);
		const updated: ConversationSummary = {
			otherUserId,
			otherUserName,
			otherUserRole,
			lastMessage: message,
			lastAt,
			unreadCount: viewingThis ? 0 : (existing?.unreadCount ?? 0) + 1
		};
		serverConversations = [
			updated,
			...serverConversations.filter((c) => c.otherUserId !== otherUserId)
		];
	}

	$effect(() => {
		if (!socket) return;

		function onMessage(payload: any) {
			const mine = payload.senderId === currentUserId;
			const otherUserId = mine ? payload.receiverId : payload.senderId;
			const otherUserName = mine ? payload.receiverName : payload.senderName;
			const otherUserRole = mine ? payload.receiverRole : payload.senderRole;
			const viewingThis = open && view === 'chat' && activeId === otherUserId;

			chatConversations.ensureConversation(otherUserId, otherUserName, otherUserRole);
			chatConversations.addMessage(
				otherUserId,
				{
					id: payload.id,
					senderId: payload.senderId,
					senderName: payload.senderName,
					senderRole: payload.senderRole,
					receiverId: payload.receiverId,
					receiverName: payload.receiverName,
					receiverRole: payload.receiverRole,
					message: payload.message,
					timestamp: new Date(payload.timestamp),
					isMine: mine,
					replyToId: payload.replyToId ?? null,
					replyTo: payload.replyTo ?? null
				},
				!mine && !viewingThis
			);

			if (!mine) {
				updateSummaryFromMessage(
					otherUserId,
					otherUserName,
					otherUserRole,
					payload.message,
					payload.timestamp,
					viewingThis
				);
				// Auto-open the chat list whenever a message arrives that isn't already being viewed.
				if (!viewingThis) {
					open = true;
					view = 'list';
				}
			}
		}

		function onHistory(payload: any) {
			const { otherUserId, messages } = payload;
			if (!otherUserId || !Array.isArray(messages)) return;
			chatConversations.setHistory(
				otherUserId,
				messages.map((m: any) => ({
					id: m.id,
					senderId: m.senderId,
					senderName: m.senderName,
					senderRole: m.senderRole,
					receiverId: m.receiverId,
					receiverName: m.receiverName,
					receiverRole: m.receiverRole,
					message: m.message,
					timestamp: new Date(m.timestamp),
					isMine: m.senderId === currentUserId,
					replyToId: m.replyToId ?? null,
					replyTo: m.replyTo ?? null
				}))
			);
			chatConversations.markRead(otherUserId);
			serverConversations = serverConversations.map((c) =>
				c.otherUserId === otherUserId ? { ...c, unreadCount: 0 } : c
			);
		}

		socket.on('chat:message', onMessage);
		socket.on('chat:history', onHistory);
		return () => {
			socket.off('chat:message', onMessage);
			socket.off('chat:history', onHistory);
		};
	});

	function toggle() {
		open = !open;
		if (open) {
			view = 'list';
			void fetchConversations();
		}
	}

	function openConversation(otherUserId: string, otherUserName: string, otherUserRole: string) {
		chatConversations.ensureConversation(otherUserId, otherUserName, otherUserRole);
		activeChatUserId.set(otherUserId);
		chatConversations.markRead(otherUserId);
		serverConversations = serverConversations.map((c) =>
			c.otherUserId === otherUserId ? { ...c, unreadCount: 0 } : c
		);
		socket?.emit('chat:history', { otherUserId });
		replyingTo = null;
		view = 'chat';
	}

	function backToList() {
		view = 'list';
		replyingTo = null;
		void fetchConversations();
	}

	function openContacts() {
		view = 'contacts';
		void fetchContacts();
	}

	function pickContact(contact: Contact) {
		openConversation(contact.id, contact.fullname, contact.role);
	}

	function startReply(msg: ChatMessage) {
		replyingTo = { id: msg.id, senderName: msg.senderName, message: msg.message };
	}
	function cancelReply() {
		replyingTo = null;
	}

	function scrollToMessage(id: string) {
		const el = messagesEl?.querySelector(`[data-msg-id="${id}"]`);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			el.classList.add('nb-flash');
			setTimeout(() => el.classList.remove('nb-flash'), 1000);
		}
	}

	function send() {
		const msg = text.trim();
		if (!msg || !socket || !activeConversation) return;
		socket.emit('chat:send', {
			receiverId: activeConversation.otherUserId,
			message: msg,
			replyToId: replyingTo?.id ?? undefined
		});
		replyingTo = null;
		text = '';
	}

	$effect(() => {
		if (view === 'chat' && activeConversation?.messages) {
			setTimeout(() => {
				if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
			}, 0);
		}
	});

	function formatRelative(ts: Date | string | null): string {
		if (!ts) return '';
		const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
		if (diff < 60) return `${diff}d`;
		if (diff < 3600) return `${Math.floor(diff / 60)}m`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
		return `${Math.floor(diff / 86400)}hr`;
	}

	const mergedConversations = $derived(
		serverConversations.map((c) => ({
			...c,
			unreadCount: conversations[c.otherUserId]?.unreadCount ?? c.unreadCount
		}))
	);

	const totalUnread = $derived(mergedConversations.reduce((sum, c) => sum + c.unreadCount, 0));
</script>

<!-- ── Floating container ───────────────────────────────── -->
<div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
	{#if open}
		<!-- ── Panel ──────────────────────────────────────── -->
		<div
			class="w-80 flex flex-col overflow-hidden rounded-xl"
			style="height:460px; background-color:var(--nb-card-bg); border:3px solid var(--nb-border); box-shadow:6px 6px 0 0 var(--nb-shadow);"
		>
			{#if view === 'list'}
				<!-- ══ CONVERSATION LIST ══════════════════════ -->

				<ChatHeader {title} onClose={toggle}>
					{#snippet right()}
						<button
							class="shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-all duration-100 hover:opacity-70"
							style="color:var(--nb-card-bg);"
							onclick={openContacts}
							aria-label="Chat baru"
						>
							<svg
								class="w-4 h-4"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								viewBox="0 0 24 24"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
							</svg>
						</button>
					{/snippet}
				</ChatHeader>

				<!-- List body -->
				<div class="flex-1 overflow-y-auto">
					{#if loadingList}
						<div class="flex items-center justify-center h-full gap-2">
							<div
								class="w-5 h-5 border-2 border-t-transparent animate-spin"
								style="border-color:var(--nb-border); border-top-color:transparent;"
							></div>
							<span
								class="text-xs font-black uppercase tracking-wide"
								style="color:var(--text-secondary);">Memuat...</span
							>
						</div>
					{:else if mergedConversations.length === 0}
						<div class="flex flex-col items-center justify-center h-full gap-3 p-6">
							<div
								class="w-10 h-10 border-2 rounded-lg flex items-center justify-center"
								style="border-color:var(--nb-border); background-color:var(--bg-secondary); box-shadow:3px 3px 0 0 var(--nb-shadow);"
							>
								<svg
									class="w-5 h-5"
									style="color:var(--text-secondary);"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									/>
								</svg>
							</div>
							<div class="text-center">
								<p
									class="text-sm font-black uppercase tracking-wide"
									style="color:var(--text-secondary);"
								>
									Belum ada chat
								</p>
								<p class="text-xs mt-1" style="color:var(--text-secondary);">
									Tekan + untuk memulai chat baru
								</p>
							</div>
						</div>
					{:else}
						<ul>
							{#each mergedConversations as conv (conv.otherUserId)}
								<li>
									<button
										class="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors duration-100 hover:bg-(--bg-secondary)"
										style="border-bottom:2px solid var(--nb-border);"
										onclick={() =>
											openConversation(conv.otherUserId, conv.otherUserName, conv.otherUserRole)}
									>
										<!-- Avatar -->
										<span
											class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm uppercase"
											style="border:2px solid var(--nb-border); background-color:var(--bg-secondary); color:var(--text-primary);"
										>
											{conv.otherUserName?.charAt(0) ?? '?'}
										</span>

										<!-- Info -->
										<div class="flex-1 min-w-0">
											<div class="flex items-baseline justify-between gap-2">
												<p class="text-sm font-black truncate" style="color:var(--text-primary);">
													{conv.otherUserName}
												</p>
												<span
													class="text-[10px] font-bold uppercase shrink-0"
													style="color:var(--text-secondary);">{formatRelative(conv.lastAt)}</span
												>
											</div>
											{#if conv.lastMessage}
												<p class="text-xs truncate mt-1" style="color:var(--text-secondary);">
													{conv.lastMessage}
												</p>
											{:else}
												<p
													class="text-xs italic truncate mt-1"
													style="color:var(--text-secondary);"
												>
													Belum ada pesan
												</p>
											{/if}
										</div>

										<!-- Unread badge -->
										{#if conv.unreadCount > 0}
											<span
												class="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none"
												style="background-color:#ef4444; color:#fff; border:2px solid var(--nb-border); box-shadow:2px 2px 0 0 var(--nb-border);"
											>
												{conv.unreadCount > 99 ? '99+' : conv.unreadCount}
											</span>
										{/if}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{:else if view === 'contacts'}
				<!-- ══ CONTACT PICKER ═══════════════════════ -->

				<ChatHeader title="Pilih Kontak" onBack={backToList} onClose={toggle} />

				<div class="flex-1 overflow-y-auto">
					{#if loadingContacts}
						<div class="flex items-center justify-center h-full gap-2">
							<div
								class="w-5 h-5 border-2 border-t-transparent animate-spin"
								style="border-color:var(--nb-border); border-top-color:transparent;"
							></div>
							<span
								class="text-xs font-black uppercase tracking-wide"
								style="color:var(--text-secondary);">Memuat...</span
							>
						</div>
					{:else if contacts.length === 0}
						<div class="flex flex-col items-center justify-center h-full gap-2 p-6">
							<p
								class="text-xs font-black uppercase tracking-wide"
								style="color:var(--text-secondary);"
							>
								Tidak ada kontak
							</p>
						</div>
					{:else}
						<ul>
							{#each contacts as contact (contact.id)}
								<li>
									<button
										class="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-100 hover:bg-(--bg-secondary)"
										style="border-bottom:2px solid var(--nb-border);"
										onclick={() => pickContact(contact)}
									>
										<span
											class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm uppercase"
											style="border:2px solid var(--nb-border); background-color:var(--bg-secondary); color:var(--text-primary);"
										>
											{contact.fullname?.charAt(0) ?? '?'}
										</span>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-black truncate" style="color:var(--text-primary);">
												{contact.fullname}
											</p>
											<p class="text-xs font-bold truncate" style="color:var(--text-secondary);">
												@{contact.username}
											</p>
										</div>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			{:else}
				<!-- ══ CHAT VIEW ══════════════════════════════ -->

				<ChatHeader
					title={activeConversation?.otherUserName ?? ''}
					subtitle={activeConversation?.otherUserRole === 'ADMIN' ? 'Admin' : 'Pengawas'}
					onBack={backToList}
					onClose={toggle}
				/>

				<!-- Messages -->
				<div
					class="flex-1 overflow-y-auto p-3 space-y-3"
					style="background-color:var(--bg-secondary);"
					bind:this={messagesEl}
				>
					{#if !activeConversation || activeConversation.messages.length === 0}
						<div class="flex flex-col items-center justify-center h-full gap-2">
							<p
								class="text-xs font-black uppercase tracking-wide"
								style="color:var(--text-secondary);"
							>
								Belum ada pesan
							</p>
						</div>
					{:else}
						{#each activeConversation.messages as msg (msg.id)}
							<ChatBubble
								id={msg.id}
								mine={msg.isMine}
								senderName={msg.senderName}
								message={msg.message}
								timestamp={msg.timestamp}
								replyTo={msg.replyTo}
								onReply={() => startReply(msg)}
								onScrollToReply={scrollToMessage}
							/>
						{/each}
					{/if}
				</div>

				<ChatInput
					bind:text
					{replyingTo}
					disabled={!activeConversation}
					placeholder="Ketik pesan..."
					onSend={send}
					onCancelReply={cancelReply}
				/>
			{/if}
		</div>
	{/if}

	<!-- ── Bubble button ───────────────────────────────── -->
	<ChatToggleButton unread={totalUnread} {ariaLabel} onclick={toggle} />
</div>
