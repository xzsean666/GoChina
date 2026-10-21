<script setup lang="ts">
import { computed } from 'vue';
import type { EntitlementRecord } from '@/api/client';
import QuotaGauge from '@/components/dashboard/QuotaGauge.vue';
import {
  Calendar,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-vue-next';

const props = defineProps<{
  entitlement: EntitlementRecord;
  planName?: string;
}>();

const emit = defineEmits<{
  (e: 'view-token', entitlement: EntitlementRecord): void;
  (e: 'renew', entitlement: EntitlementRecord): void;
}>();

const daysRemaining = computed(() => {
  const now = Date.now();
  const diff = props.entitlement.expires_at - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

const isExpired = computed(() => {
  return props.entitlement.status === 'expired' || daysRemaining.value <= 0;
});

const formattedExpiresAt = computed(() => {
  return new Date(props.entitlement.expires_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

function handleViewToken() {
  emit('view-token', props.entitlement);
}

function handleRenew() {
  emit('renew', props.entitlement);
}
</script>

<template>
  <div
    class="p-6 sm:p-7 rounded-3xl bg-white dark:bg-dark-card border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1"
    :class="[
      isExpired
        ? 'border-slate-200 dark:border-white/[0.05] opacity-75'
        : 'border-slate-200/90 dark:border-white/[0.08] hover:border-brand-500/40 shadow-glow-brand'
    ]"
  >
    <div>
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div>
          <span class="text-[11px] font-mono uppercase tracking-widest text-brand-600 dark:text-brand-400 font-semibold">
            {{ entitlement.plan_id }}
          </span>
          <h3 class="text-xl font-display font-extrabold text-slate-900 dark:text-white mt-1">
            {{ planName || 'Dedicated Edge Entitlement' }}
          </h3>
        </div>

        <!-- Status badge -->
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold capitalize"
          :class="[
            isExpired
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          ]"
        >
          <span class="w-1.5 h-1.5 rounded-full" :class="isExpired ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'"></span>
          <span>{{ isExpired ? 'Expired' : 'Active' }}</span>
        </span>
      </div>

      <!-- Expiration Date & Countdown -->
      <div class="flex items-center justify-between py-3 mb-5 border-y border-slate-100 dark:border-white/[0.05] text-xs text-slate-500 dark:text-slate-400">
        <div class="flex items-center gap-1.5">
          <Calendar class="w-3.5 h-3.5 text-brand-500" />
          <span>Valid until: <strong class="text-slate-800 dark:text-slate-200 font-medium">{{ formattedExpiresAt }}</strong></span>
        </div>
        <div>
          <span
            class="font-mono font-bold text-xs px-2 py-0.5 rounded-md"
            :class="daysRemaining <= 3 ? 'bg-rose-500/10 text-rose-500' : 'bg-brand-500/10 text-brand-600 dark:text-brand-400'"
          >
            {{ daysRemaining }}d left
          </span>
        </div>
      </div>

      <!-- Quota Gauge -->
      <div class="mb-6">
        <QuotaGauge
          :used="entitlement.quota_used"
          :total="entitlement.quota_limit"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.05]">
      <button
        type="button"
        class="flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
        @click="handleViewToken"
      >
        <KeyRound class="w-3.5 h-3.5 text-brand-500" />
        <span>Credentials</span>
      </button>

      <button
        type="button"
        class="py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 shadow-sm hover:shadow-glow-brand transition-all flex items-center justify-center gap-1.5"
        @click="handleRenew"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>Renew</span>
      </button>
    </div>
  </div>
</template>
