import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

const toasts = ref<ToastMessage[]>([]);

export function useToast() {
  function removeToast(id: string) {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  }

  function addToast(options: {
    type?: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = options.duration ?? 4000;
    const toast: ToastMessage = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration,
    };

    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }

  const toast = {
    show: addToast,
    success(title: string, message?: string, duration?: number) {
      return addToast({ type: 'success', title, message, duration });
    },
    error(title: string, message?: string, duration?: number) {
      return addToast({ type: 'error', title, message, duration });
    },
    info(title: string, message?: string, duration?: number) {
      return addToast({ type: 'info', title, message, duration });
    },
    warning(title: string, message?: string, duration?: number) {
      return addToast({ type: 'warning', title, message, duration });
    },
    remove: removeToast,
    clear() {
      toasts.value = [];
    },
  };

  return {
    toasts,
    toast,
    addToast,
    removeToast,
  };
}
