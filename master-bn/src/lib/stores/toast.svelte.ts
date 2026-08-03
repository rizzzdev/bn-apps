export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

class ToastState {
	toasts = $state<ToastMessage[]>([]);

	add(type: ToastType, message: string, duration = 3000) {
		const id = crypto.randomUUID();
		this.toasts.push({ id, type, message, duration });

		if (duration > 0) {
			setTimeout(() => {
				this.remove(id);
			}, duration);
		}
	}

	remove(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	success(message: string, duration?: number) {
		this.add('success', message, duration);
	}

	error(message: string, duration?: number) {
		this.add('error', message, duration);
	}

	warning(message: string, duration?: number) {
		this.add('warning', message, duration);
	}

	info(message: string, duration?: number) {
		this.add('info', message, duration);
	}
}

export const toast = new ToastState();
