export type ToastType = 'success' | 'error' | 'info' | 'warning';

export const toastState = $state({
	show: false,
	message: '',
	type: 'info' as ToastType
});

export const toast = {
	show(message: string, type: ToastType = 'info') {
		toastState.message = message;
		toastState.type = type;
		toastState.show = true;
	},
	success(message: string) { this.show(message, 'success'); },
	error(message: string) { this.show(message, 'error'); },
	info(message: string) { this.show(message, 'info'); },
	warning(message: string) { this.show(message, 'warning'); }
};
