<script setup lang="ts">
import { computed } from 'vue';
import type { PlanDefinition } from '@/api/client';
import { Check, Zap, Sparkles, Clock, HardDrive, ShieldCheck } from 'lucide-vue-next';

const props = defineProps<{
  plan: PlanDefinition;
  billingPeriod?: 'all' | 'monthly' | 'quarterly' | 'yearly';
  isPopular?: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', plan: PlanDefinition): void;
}>();

const discountBadge = computed(() => {
  if (props.plan.duration_days >= 365) return 'Save 30%';
  if (props.plan.duration_days >= 90) return 'Save 15%';
  return null;
});

const dailyPrice = computed(() => {
  if (!props.plan.duration_days || props.plan.duration_days <= 0) return null;
  const perDay = props.plan.price_usd / props.plan.duration_days;
  return perDay < 1 ? perDay.toFixed(2) : perDay.toFixed(2);
});

function formatQuota(bytes: number): string {
  if (bytes <= 0) return 'Unlimited Quota';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb} GB High-Speed`;
}

function handleSelect() {
  emit('select', props.plan);
}
</script>

<template>
  <div
    class="relative flex flex-col justify-between p-7 sm:p-8 rounded-3xl transition-all duration-300 group"
    :class="[
      isPopular
        ? 'border-2 border-brand-500/80 bg-gradient-to-b from-brand-500/[0.08] via-white dark:via-dark-card to-white dark:to-dark-card shadow-2xl shadow-brand-500/15 lg:-translate-y-2 z-10'
        : 'border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-dark-card/80 hover:border-brand-500/40 dark:hover:border-brand-400/30 hover:shadow-xl hover:-translate-y-1'
    ]"
  >
    <!-- Ambient subtle background glow for Pro tier -->
    <div
      v-if="isPopular"
      class="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-32 bg-brand-500/20 blur-2xl rounded-full pointer-events-none -z-10"
      aria-hidden="true"
    />

    <!-- Top Badge / Ribbon -->
    <div
      v-if="isPopular || discountBadge"
      class="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider text-white shadow-md"
      :class="isPopular ? 'bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 shadow-glow-brand' : 'bg-slate-900 dark:bg-slate-700 border border-slate-700'"
    >
      <Sparkles v-if="isPopular" class="w-3.5 h-3.5" />
      <span>{{ isPopular ? 'Recommended Tier' : discountBadge }}</span>
    </div>

    <div>
      <!-- Header / Category -->
      <div class="mb-5">
        <div class="flex items-center justify-between">
          <span
            class="text-[11px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
            :class="isPopular ? 'text-brand-600 dark:text-brand-400 border-brand-500/30 bg-brand-500/10' : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/60'"
          >
            {{ plan.category }}
          </span>
          <span v-if="discountBadge && isPopular" class="text-[10px] font-mono text-cyan-500 font-bold">
            {{ discountBadge }}
          </span>
        </div>

        <h3 class="text-2xl font-display font-extrabold text-slate-900 dark:text-white mt-3 group-hover:text-brand-500 transition-colors">
          {{ plan.name }}
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed min-h-[36px]">
          {{ plan.description }}
        </p>
      </div>

      <!-- Pricing Block -->
      <div class="my-6 py-6 border-y border-slate-100 dark:border-white/[0.06]">
        <div class="flex items-baseline">
          <span class="text-4xl sm:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white">
            ${{ plan.price_usd }}
          </span>
          <span class="ml-2.5 text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
            {{ plan.currency }} / {{ plan.duration_days }}d
          </span>
        </div>

        <div v-if="dailyPrice" class="mt-1 text-[11px] font-mono text-slate-400 dark:text-slate-500">
          Equivalent to ~${{ dailyPrice }}/day
        </div>

        <!-- Metric Specs Pills -->
        <div class="mt-4 flex flex-wrap gap-2 text-xs">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
            <Clock class="w-3.5 h-3.5 text-brand-500" />
            <span>{{ plan.duration_days }} Days Active</span>
          </div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
            <HardDrive class="w-3.5 h-3.5 text-cyan-500" />
            <span>{{ formatQuota(plan.quota_limit) }}</span>
          </div>
        </div>
      </div>

      <!-- Features Checklist -->
      <ul class="space-y-3 mb-8 text-xs text-slate-600 dark:text-slate-300">
        <li
          v-for="(feature, idx) in plan.features"
          :key="idx"
          class="flex items-start"
        >
          <div
            class="w-4 h-4 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0"
            :class="isPopular ? 'bg-brand-500/15 text-brand-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'"
          >
            <Check class="w-3 h-3 stroke-[3]" />
          </div>
          <span class="leading-relaxed">{{ feature }}</span>
        </li>
      </ul>
    </div>

    <!-- CTA Button -->
    <button
      type="button"
      class="w-full py-3 px-5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 group/btn"
      :class="[
        isPopular
          ? 'bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white shadow-glow-brand hover:scale-[1.02] active:scale-[0.98]'
          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700/80 dark:text-white border border-transparent hover:border-slate-700'
      ]"
      @click="handleSelect"
    >
      <Zap class="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform duration-200" />
      <span>Subscribe with Crypto</span>
    </button>
  </div>
</template>
