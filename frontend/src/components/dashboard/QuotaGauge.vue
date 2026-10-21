<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  used: number;
  total: number;
}>();

const percentage = computed(() => {
  if (props.total <= 0) return 0;
  const pct = Math.min(100, Math.round((props.used / props.total) * 100));
  return pct;
});

const formattedUsed = computed(() => formatBytes(props.used));
const formattedTotal = computed(() => formatBytes(props.total));

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 GB';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(1)} TB`;
  }
  return `${gb.toFixed(1)} GB`;
}

const colorClass = computed(() => {
  if (percentage.value >= 90) return 'bg-gradient-to-r from-rose-500 to-amber-500 shadow-glow-brand';
  if (percentage.value >= 75) return 'bg-gradient-to-r from-amber-500 to-yellow-500';
  return 'bg-gradient-to-r from-brand-500 to-cyan-500 shadow-glow-brand';
});
</script>

<template>
  <div class="space-y-2.5">
    <div class="flex items-center justify-between text-xs">
      <span class="text-slate-500 dark:text-slate-400 font-medium">Bandwidth Quota</span>
      <span class="font-mono font-bold text-slate-800 dark:text-slate-200">
        {{ formattedUsed }} / {{ formattedTotal }}
        <span class="ml-1 text-[11px] px-1.5 py-0.5 rounded-md font-mono" :class="percentage >= 90 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'">
          {{ percentage }}%
        </span>
      </span>
    </div>

    <!-- Progress bar track -->
    <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200/60 dark:border-white/[0.05]">
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="colorClass"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>
