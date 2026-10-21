<script setup lang="ts">
import { ref } from 'vue';
import type { OrderRecord } from '@/api/client';
import { useToast } from '@/composables/useToast';
import {
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-vue-next';

defineProps<{
  orders: OrderRecord[];
  isLoading: boolean;
  nextCursor?: string;
}>();

const emit = defineEmits<{
  (e: 'load-more'): void;
}>();

const { toast } = useToast();
const copiedId = ref<string | null>(null);

async function copyText(text: string, id: string) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    copiedId.value = id;
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = null;
    }, 2000);
  } catch (err) {
    toast.warning('Clipboard Access', 'Failed to copy.');
  }
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(str: string, lead = 6, tail = 4): string {
  if (!str || str.length <= lead + tail) return str;
  return `${str.slice(0, lead)}...${str.slice(-tail)}`;
}
</script>

<template>
  <div class="space-y-5">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-display font-extrabold text-slate-900 dark:text-white">
          Order Audit & Pay3 Diagnostics
        </h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Track real-time blockchain settlement status, HD child deposit addresses, and Pay3 reconciliations.
        </p>
      </div>
    </div>

    <!-- Audit Table -->
    <div class="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-dark-card shadow-sm">
      <table class="w-full text-left text-xs text-slate-600 dark:text-slate-300">
        <thead class="bg-slate-50 dark:bg-dark-surface text-slate-700 dark:text-slate-300 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200/80 dark:border-white/[0.08]">
          <tr>
            <th class="px-5 py-3.5">Order ID / Created</th>
            <th class="px-5 py-3.5">User</th>
            <th class="px-5 py-3.5">Plan</th>
            <th class="px-5 py-3.5">Amount</th>
            <th class="px-5 py-3.5">Pay3 Deposit Address</th>
            <th class="px-5 py-3.5">Pay3 Ref</th>
            <th class="px-5 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-white/[0.05]">
          <tr v-if="orders.length === 0" class="text-center py-8">
            <td colspan="7" class="py-12 text-slate-400">
              No orders recorded yet.
            </td>
          </tr>
          <tr
            v-for="order in orders"
            :key="order.id"
            class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
          >
            <!-- Order ID & Time -->
            <td class="px-5 py-4">
              <div class="font-mono font-bold text-slate-900 dark:text-white">
                {{ order.id }}
              </div>
              <div class="font-mono text-[10px] text-slate-400">
                {{ formatDate(order.created_at) }}
              </div>
            </td>

            <!-- User -->
            <td class="px-5 py-4 font-mono text-slate-700 dark:text-slate-300">
              {{ truncate(order.user_id, 8, 4) }}
            </td>

            <!-- Plan -->
            <td class="px-5 py-4 font-medium text-slate-800 dark:text-slate-200">
              {{ order.plan_id }}
            </td>

            <!-- Amount -->
            <td class="px-5 py-4 font-mono font-bold text-slate-900 dark:text-white">
              {{ order.expected_amount }} {{ order.token_symbol }}
            </td>

            <!-- Deposit Address -->
            <td class="px-5 py-4">
              <div class="flex items-center gap-1.5 font-mono text-xs">
                <span>{{ truncate(order.deposit_address, 8, 6) }}</span>
                <button
                  type="button"
                  class="p-1 text-slate-400 hover:text-brand-500 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Copy address"
                  @click="copyText(order.deposit_address, `addr-${order.id}`)"
                >
                  <Check v-if="copiedId === `addr-${order.id}`" class="w-3.5 h-3.5 text-brand-500" />
                  <Copy v-else class="w-3.5 h-3.5" />
                </button>
              </div>
            </td>

            <!-- Pay3 Order ID -->
            <td class="px-5 py-4 font-mono text-[11px] text-slate-400">
              {{ truncate(order.pay3_order_id, 8, 4) }}
            </td>

            <!-- Status -->
            <td class="px-5 py-4">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold capitalize"
                :class="{
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20': order.status === 'paid',
                  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20': order.status === 'pending',
                  'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20': order.status === 'expired' || order.status === 'failed',
                }"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="{
                  'bg-emerald-500': order.status === 'paid',
                  'bg-amber-500 animate-ping': order.status === 'pending',
                  'bg-rose-500': order.status === 'expired' || order.status === 'failed',
                }"></span>
                <span>{{ order.status }}</span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Keyset Cursor Pagination -->
    <div v-if="nextCursor" class="pt-2 text-center">
      <button
        type="button"
        class="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 transition-colors gap-2"
        :disabled="isLoading"
        @click="emit('load-more')"
      >
        <span>Load More Orders</span>
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
