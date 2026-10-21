import { ref, onUnmounted, getCurrentInstance } from 'vue';
import { api, type OrderRecord } from '@/api/client';

export function useOrderPolling(options?: {
  intervalMs?: number;
  onPaid?: (order: OrderRecord) => void;
  onExpired?: (order: OrderRecord) => void;
}) {
  const intervalMs = options?.intervalMs ?? 5000;
  const isPolling = ref(false);
  const currentOrder = ref<OrderRecord | null>(null);
  let timer: ReturnType<typeof setInterval> | null = null;

  async function pollOnce(orderId: string) {
    try {
      const order = await api.getOrder(orderId);
      currentOrder.value = order;

      if (order.status === 'paid') {
        stop();
        options?.onPaid?.(order);
      } else if (order.status === 'expired' || order.status === 'failed') {
        stop();
        options?.onExpired?.(order);
      }
    } catch (err) {
      // Continue polling despite temporary network hiccups
    }
  }

  function start(orderId: string) {
    stop();
    isPolling.value = true;
    pollOnce(orderId);
    timer = setInterval(() => {
      pollOnce(orderId);
    }, intervalMs);
  }

  function stop() {
    isPolling.value = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  if (getCurrentInstance()) {
    onUnmounted(() => {
      stop();
    });
  }

  return {
    isPolling,
    currentOrder,
    start,
    stop,
    pollOnce,
  };
}
