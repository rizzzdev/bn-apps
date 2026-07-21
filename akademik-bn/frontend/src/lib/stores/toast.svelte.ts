import { Icon } from '$lib/components/atoms';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
	id: string;
	type: ToastType;
	message: string;
	duration: number;
}

class ToastState {
	toasts = $state<ToastMessage[]>([]);

	add(type: ToastType, message: string, duration = 3000) {
		const id = crypto.randomUUID();
		this.toasts = [...this.toasts, { id, type, message, duration }];
		if (duration > 0) {
			setTimeout(() => {
				this.remove(id);
			}, duration);
		}
	}

	success(message: string) {
		this.add('success', message);
	}

	error(message: string) {
		this.add('error', message);
	}

	info(message: string) {
		this.add('info', message);
	}

	remove(id: string) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}
}

export const toast = new ToastState();
