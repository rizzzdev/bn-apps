export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
	id: number;
	type: ToastType;
	message: string;
	duration: number;
}

let nextId = 0;

class ToastState {
	toasts = $state<ToastMessage[]>([]);

	add(type: ToastType, message: string, duration = 4000) {
		const id = nextId++;
		const toast: ToastMessage = { id, type, message, duration };
		this.toasts = [...this.toasts, toast];
		setTimeout(() => this.remove(id), duration);
	}

	remove(id: number) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	info(message: string, duration?: number) {
		this.add('info', message, duration);
	}

	success(message: string, duration?: number) {
		this.add('success', message, duration);
	}

	warning(message: string, duration?: number) {
		this.add('warning', message, duration);
	}

	error(message: string, duration?: number) {
		this.add('error', message, duration);
	}
}

export const toast = new ToastState();
