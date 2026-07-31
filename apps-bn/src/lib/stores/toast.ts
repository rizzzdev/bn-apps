import { writable } from 'svelte/store';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

function createToastStore() {
  const { subscribe, update } = writable<ToastItem[]>([]);

  const add = (type: ToastType, message: string, title?: string, duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, title, message, duration };

    update(toasts => [...toasts, item]);

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }

    return id;
  };

  const remove = (id: string) => {
    update(toasts => toasts.filter(t => t.id !== id));
  };

  return {
    subscribe,
    info: (message: string, title?: string, duration?: number) => add('info', message, title, duration),
    success: (message: string, title?: string, duration?: number) => add('success', message, title, duration),
    warning: (message: string, title?: string, duration?: number) => add('warning', message, title, duration),
    error: (message: string, title?: string, duration?: number) => add('error', message, title, duration),
    remove
  };
}

export const toast = createToastStore();
