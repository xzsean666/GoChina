<script setup lang="ts">
import { useToast, type ToastType } from '@/composables/useToast';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-vue-next';

const { toasts, removeToast } = useToast();

function getIcon(type: ToastType) {
  switch (type) {
    case 'success':
      return CheckCircle2;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
    default:
      return Info;
  }
}

function getStyle(type: ToastType) {
  switch (type) {
    case 'success':
      return 'border-emerald-500/40 bg-white/90 dark:bg-slate-900/90 text-emerald-600 dark:text-emerald-400 shadow-glow-brand';
    case 'error':
      return 'border-rose-500/40 bg-white/90 dark:bg-slate-900/90 text-rose-600 dark:text-rose-400 shadow-lg';
    case 'warning':
      return 'border-amber-500/40 bg-white/90 dark:bg-slate-900/90 text-amber-600 dark:text-amber-400 shadow-lg';
    case 'info':
    default:
      return 'border-cyan-500/40 bg-white/90 dark:bg-slate-900/90 text-cyan-600 dark:text-cyan-400 shadow-glow-cyan';
  }
}
</script>

<template>
  <div
    class="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
  >
    <TransitionGroup
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-3 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto flex items-start p-4 rounded-2xl shadow-xl border backdrop-blur-xl transition-all duration-200"
        :class="getStyle(t.type)"
        role="alert"
      >
        <component
          :is="getIcon(t.type)"
          class="w-5 h-5 mt-0.5 mr-3 flex-shrink-0"
        />
        <div class="flex-1 min-w-0 mr-2">
          <p class="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
            {{ t.title }}
          </p>
          <p
            v-if="t.message"
            class="mt-1 text-xs text-slate-600 dark:text-slate-300 break-words leading-relaxed"
          >
            {{ t.message }}
          </p>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          @click="removeToast(t.id)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
