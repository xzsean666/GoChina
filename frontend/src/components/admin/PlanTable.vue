<script setup lang="ts">
import type { PlanDefinition } from '@/api/client';
import { Plus, Edit2, CheckCircle2, XCircle, HardDrive, Clock } from 'lucide-vue-next';

defineProps<{
  plans: PlanDefinition[];
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'create'): void;
  (e: 'edit', plan: PlanDefinition): void;
  (e: 'toggle-enabled', plan: PlanDefinition): void;
}>();

function formatQuota(bytes: number): string {
  if (bytes <= 0) return 'Unlimited';
  const gb = bytes / (1024 * 1024 * 1024);
  return `${gb} GB`;
}
</script>

<template>
  <div class="space-y-5">
    <!-- Header with Create CTA -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-display font-extrabold text-slate-900 dark:text-white">
          Active Plan Catalog
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Define pricing, bandwidth limits, and durations for subscription services.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 shadow-glow-brand transition-all gap-1.5"
        @click="emit('create')"
      >
        <Plus class="w-4 h-4" />
        <span>Create Plan</span>
      </button>
    </div>

    <!-- Plans Table -->
    <div class="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-dark-card shadow-sm">
      <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
        <thead class="bg-slate-50 dark:bg-dark-surface text-slate-700 dark:text-slate-300 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80 dark:border-white/[0.08]">
          <tr>
            <th class="px-5 py-3.5">Plan Details</th>
            <th class="px-5 py-3.5">Category</th>
            <th class="px-5 py-3.5">Price USD</th>
            <th class="px-5 py-3.5">Quota</th>
            <th class="px-5 py-3.5">Duration</th>
            <th class="px-5 py-3.5">Status</th>
            <th class="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/[0.05]">
          <tr v-if="plans.length === 0" class="text-center py-8">
            <td colspan="7" class="py-12 text-slate-400">
              No plans registered yet. Click "Create Plan" to add the first one.
            </td>
          </tr>
          <tr
            v-for="plan in plans"
            :key="plan.id"
            class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
          >
            <td class="px-5 py-4">
              <div class="font-display font-bold text-slate-900 dark:text-white">
                {{ plan.name }}
              </div>
              <div class="font-mono text-[11px] text-slate-400">
                {{ plan.id }}
              </div>
            </td>
            <td class="px-5 py-4">
              <span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {{ plan.category }}
              </span>
            </td>
            <td class="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
              ${{ plan.price_usd }} {{ plan.currency }}
            </td>
            <td class="px-5 py-4">
              <div class="flex items-center gap-1.5 font-mono">
                <HardDrive class="w-3.5 h-3.5 text-cyan-500" />
                <span>{{ formatQuota(plan.quota_limit) }}</span>
              </div>
            </td>
            <td class="px-5 py-4">
              <div class="flex items-center gap-1.5 font-mono">
                <Clock class="w-3.5 h-3.5 text-brand-500" />
                <span>{{ plan.duration_days }} Days</span>
              </div>
            </td>
            <td class="px-5 py-4">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold transition-colors"
                :class="[
                  plan.enabled
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                ]"
                @click="emit('toggle-enabled', plan)"
              >
                <component :is="plan.enabled ? CheckCircle2 : XCircle" class="w-3.5 h-3.5" />
                <span>{{ plan.enabled ? 'Active' : 'Disabled' }}</span>
              </button>
            </td>
            <td class="px-5 py-4 text-right">
              <button
                type="button"
                class="p-2 rounded-xl text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Plan"
                @click="emit('edit', plan)"
              >
                <Edit2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
