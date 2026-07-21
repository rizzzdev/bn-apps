import { connectSocket } from '../stores/socket';
import type { Socket } from 'socket.io-client';

class ExamStatusState {
	socket = $state<Socket | null>(null);
	statusOverrides = $state<Record<string, 'active' | 'finished'>>({});
	isOffline = $state(false);

	subscribedRoomIds = new Set<string>();

	init(token: string, initialExams: Array<{ examRoomId: string }>) {
		if (!this.socket) {
			// Handle offline status globally
			if (typeof window !== 'undefined') {
				this.isOffline = !window.navigator.onLine;
				window.addEventListener('offline', () => (this.isOffline = true));
				window.addEventListener('online', () => (this.isOffline = false));
			}

			this.socket = connectSocket(token) as Socket;

			this.socket.on('exam:started', (payload: any) => {
				this.statusOverrides[payload.examRoomId] = 'active';
			});

			this.socket.on('exam:ended', (payload: any) => {
				this.statusOverrides[payload.examRoomId] = 'finished';
			});

			this.socket.on('connect', () => {
				if (this.subscribedRoomIds.size > 0) {
					this.socket!.emit('exam:status:subscribe', {
						examRoomIds: Array.from(this.subscribedRoomIds)
					});
				}
			});
		}

		const newRoomIds = initialExams.map((p) => p.examRoomId);
		let needsSubscribe = false;
		for (const id of newRoomIds) {
			if (!this.subscribedRoomIds.has(id)) {
				this.subscribedRoomIds.add(id);
				needsSubscribe = true;
			}
		}

		if (needsSubscribe && this.socket.connected) {
			this.socket.emit('exam:status:subscribe', {
				examRoomIds: Array.from(this.subscribedRoomIds)
			});
		}
	}

	getStatus(
		examRoomId: string,
		originalStatus: 'active' | 'upcoming' | 'finished'
	): 'active' | 'upcoming' | 'finished' {
		return this.statusOverrides[examRoomId] || originalStatus;
	}
}

export const examStatus = new ExamStatusState();
