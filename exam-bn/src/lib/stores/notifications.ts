import { writable, derived } from 'svelte/store';
import { resolveBackendUrl } from '$lib/utils/backend-url';

const API_BASE = resolveBackendUrl() + '/api/v1';

export type NotifType =
	| 'violation'
	| 'submit'
	| 'score_ready'
	| 'exam_scheduled'
	| 'exam_start'
	| 'exam_end'
	| 'participant_join'
	| 'participant_disconnect'
	| 'chat'
	| 'warning'
	| 'info';

export interface AppNotification {
	id: string;
	type: NotifType;
	title: string;
	message: string;
	meta?: string;
	timestamp: Date;
	read: boolean;
}

export const notifications = writable<AppNotification[]>([]);
export const unreadCount = derived(notifications, ($n) => $n.filter((n) => !n.read).length);

// Push an in-memory notification (backend already persisted it; this keeps UI in sync)
export function pushNotification(
	type: NotifType,
	title: string,
	message: string,
	meta?: string,
	id?: string
): void {
	const n: AppNotification = {
		id: id ?? `local-${Date.now()}-${Math.random()}`,
		type,
		title,
		message,
		meta,
		timestamp: new Date(),
		read: false
	};
	notifications.update((list) => [n, ...list].slice(0, 100));
}

export function markAllRead(): void {
	notifications.update((list) => list.map((n) => ({ ...n, read: true })));
}

export function clearAll(): void {
	notifications.set([]);
}

// Load persisted notifications from the API on mount
export async function loadNotifications(token: string): Promise<void> {
	try {
		const res = await fetch(`${API_BASE}/exam/notifications`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (!res.ok) return;
		const body = await res.json();
		const data: Array<{
			id: string;
			type: string;
			title: string;
			message: string;
			meta: string | null;
			read: boolean;
			createdAt: string;
		}> = body.data ?? [];
		notifications.set(
			data.map((n) => ({
				id: n.id,
				type: n.type as NotifType,
				title: n.title,
				message: n.message,
				meta: n.meta ?? undefined,
				timestamp: new Date(n.createdAt),
				read: n.read
			}))
		);
	} catch {
		// silently ignore
	}
}

// Bulk soft-delete all notifications via API, then clear the store
export async function clearAllPersisted(token: string): Promise<void> {
	if (token) {
		try {
			await fetch(`${API_BASE}/exam/notifications`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});
		} catch {
			// silently ignore
		}
	}
	clearAll();
}

// Mark all read via API
export async function markAllReadPersisted(token: string): Promise<void> {
	markAllRead();
	if (!token) return;
	try {
		await fetch(`${API_BASE}/exam/notifications/mark-all-read`, {
			method: 'PATCH',
			headers: { Authorization: `Bearer ${token}` }
		});
	} catch {
		// silently ignore
	}
}
