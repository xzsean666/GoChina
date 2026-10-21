import { ref, computed, watch, onUnmounted, getCurrentInstance } from 'vue';

export function useCountdown(targetTimestamp = 0) {
  const target = ref(targetTimestamp);
  const remainingSeconds = ref(0);
  let interval: ReturnType<typeof setInterval> | null = null;

  function update() {
    if (!target.value) {
      remainingSeconds.value = 0;
      return;
    }
    const now = Date.now();
    // Normalize target: if target is in seconds (10 digits), convert to ms
    const targetMs = target.value < 1e11 ? target.value * 1000 : target.value;
    const diff = Math.max(0, Math.floor((targetMs - now) / 1000));
    remainingSeconds.value = diff;

    if (diff <= 0 && interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function start(newTarget?: number) {
    if (newTarget !== undefined) {
      target.value = newTarget;
    }
    stop();
    update();
    if (remainingSeconds.value > 0) {
      interval = setInterval(update, 1000);
    }
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  const minutes = computed(() => Math.floor(remainingSeconds.value / 60));
  const seconds = computed(() => remainingSeconds.value % 60);
  const formatted = computed(() => {
    const m = String(minutes.value).padStart(2, '0');
    const s = String(seconds.value).padStart(2, '0');
    return `${m}:${s}`;
  });
  const isExpired = computed(() => remainingSeconds.value <= 0 && target.value > 0);

  watch(target, (val) => {
    if (val > 0) {
      start(val);
    }
  }, { immediate: true });

  if (getCurrentInstance()) {
    onUnmounted(() => {
      stop();
    });
  }

  return {
    remainingSeconds,
    minutes,
    seconds,
    formatted,
    isExpired,
    start,
    stop,
  };
}
