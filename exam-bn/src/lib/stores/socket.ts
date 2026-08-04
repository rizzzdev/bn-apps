import { io, type Socket } from 'socket.io-client';
import { writable } from 'svelte/store';
import { resolveBackendUrl } from '$lib/utils/backend-url';

let _socket: Socket | null = null;

export const onlineCount = writable<number>(0);

// Single source of truth for connection status — components subscribe to
// this instead of tracking their own local boolean, which can miss
// connect/disconnect events when the underlying socket is a reused singleton
// (e.g. created earlier by the layout before the component mounted).
export const connected = writable<boolean>(false);

export function connectSocket(token: string): Socket {
	if (_socket) return _socket;
	_socket = io(resolveBackendUrl(), {
		auth: { token },
		withCredentials: true,
		autoConnect: true
	});
	connected.set(_socket.connected);
	_socket.on('connect', () => connected.set(true));
	_socket.on('disconnect', () => connected.set(false));
	_socket.on('online:count', (payload: { count: number }) => {
		onlineCount.set(payload.count);
	});
	return _socket;
}

// Only call this on logout — the socket is owned by the role layout
// (admin/supervisor/participant +layout.svelte) and shared by every page and
// widget (chat, monitoring, notifications) underneath it. Disconnecting it
// from an individual page's onDestroy causes reconnect races elsewhere.
export function disconnectSocket() {
	_socket?.disconnect();
	_socket = null;
	connected.set(false);
}

export function getSocket(): Socket | null {
	return _socket;
}
