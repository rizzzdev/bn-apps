import { writable, derived } from 'svelte/store';

export interface ReplyPreview {
	id: string;
	senderName: string;
	message: string;
}

export interface ChatMessage {
	id: string;
	senderId: string;
	senderName: string;
	senderRole: string;
	receiverId: string;
	receiverName: string;
	receiverRole: string;
	message: string;
	timestamp: Date;
	isMine: boolean;
	replyToId: string | null;
	replyTo: ReplyPreview | null;
}

export interface Conversation {
	otherUserId: string;
	otherUserName: string;
	otherUserRole: string;
	messages: ChatMessage[];
	lastMessage: string;
	lastAt: Date | null;
	unreadCount: number;
	loaded: boolean;
}

function createChatStore() {
	const { subscribe, update } = writable<Record<string, Conversation>>({});

	return {
		subscribe,

		ensureConversation(otherUserId: string, otherUserName = '', otherUserRole = '') {
			update((conversations) => {
				if (!conversations[otherUserId]) {
					return {
						...conversations,
						[otherUserId]: {
							otherUserId,
							otherUserName,
							otherUserRole,
							messages: [],
							lastMessage: '',
							lastAt: null,
							unreadCount: 0,
							loaded: false
						}
					};
				}
				if (
					(otherUserName && !conversations[otherUserId].otherUserName) ||
					(otherUserRole && !conversations[otherUserId].otherUserRole)
				) {
					return {
						...conversations,
						[otherUserId]: {
							...conversations[otherUserId],
							otherUserName: otherUserName || conversations[otherUserId].otherUserName,
							otherUserRole: otherUserRole || conversations[otherUserId].otherUserRole
						}
					};
				}
				return conversations;
			});
		},

		upsertSummary(summary: {
			otherUserId: string;
			otherUserName: string;
			otherUserRole: string;
			lastMessage: string;
			lastAt: string | Date | null;
			unreadCount: number;
		}) {
			update((conversations) => {
				const existing = conversations[summary.otherUserId];
				return {
					...conversations,
					[summary.otherUserId]: {
						otherUserId: summary.otherUserId,
						otherUserName: summary.otherUserName,
						otherUserRole: summary.otherUserRole,
						messages: existing?.messages ?? [],
						lastMessage: summary.lastMessage,
						lastAt: summary.lastAt ? new Date(summary.lastAt) : null,
						unreadCount: summary.unreadCount,
						loaded: existing?.loaded ?? false
					}
				};
			});
		},

		addMessage(otherUserId: string, msg: ChatMessage, countUnread = false) {
			update((conversations) => {
				const existing = conversations[otherUserId] ?? {
					otherUserId,
					otherUserName: '',
					otherUserRole: '',
					messages: [],
					lastMessage: '',
					lastAt: null,
					unreadCount: 0,
					loaded: false
				};
				return {
					...conversations,
					[otherUserId]: {
						...existing,
						messages: [...existing.messages, msg],
						lastMessage: msg.message,
						lastAt: msg.timestamp,
						unreadCount: countUnread ? existing.unreadCount + 1 : existing.unreadCount
					}
				};
			});
		},

		setHistory(otherUserId: string, messages: ChatMessage[]) {
			update((conversations) => {
				const existing = conversations[otherUserId] ?? {
					otherUserId,
					otherUserName: '',
					otherUserRole: '',
					messages: [],
					lastMessage: '',
					lastAt: null,
					unreadCount: 0,
					loaded: false
				};
				return {
					...conversations,
					[otherUserId]: { ...existing, messages, loaded: true }
				};
			});
		},

		markRead(otherUserId: string) {
			update((conversations) => {
				if (!conversations[otherUserId]) return conversations;
				return {
					...conversations,
					[otherUserId]: { ...conversations[otherUserId], unreadCount: 0 }
				};
			});
		}
	};
}

export const chatConversations = createChatStore();

export const activeChatUserId = writable<string | null>(null);

export const chatUnreadTotal = derived(chatConversations, ($conversations) =>
	Object.values($conversations).reduce((sum, c) => sum + c.unreadCount, 0)
);
