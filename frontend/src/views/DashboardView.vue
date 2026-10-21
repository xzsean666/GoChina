<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { api, type ContractItem, type InquiryItem } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from '@/composables/useI18n';
import {
  User,
  Shield,
  FileText,
  MessageSquare,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  DollarSign,
  Calendar,
  Sparkles,
  RefreshCw,
  Wallet
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'open-auth'): void;
}>();

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const isLoading = ref(true);
const contracts = ref<ContractItem[]>([]);
const inquiries = ref<InquiryItem[]>([]);

const pendingContracts = computed(() => {
  return contracts.value.filter((c) => c.status === 'pending_payment');
});

const activeContracts = computed(() => {
  return contracts.value.filter((c) => c.status === 'active' || c.status === 'in_progress' || c.status === 'review');
});

const completedContracts = computed(() => {
  return contracts.value.filter((c) => c.status === 'completed');
});

async function loadDashboardData() {
  isLoading.value = true;
  try {
    const [cList, iList] = await Promise.all([
      api.getContracts().catch(() => []),
      api.getInquiries().catch(() => []),
    ]);
    contracts.value = cList;
    inquiries.value = iList;
  } finally {
    isLoading.value = false;
  }
}

function truncateAddress(addr?: string): string {
  if (!addr) return 'Not Connected';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await loadDashboardData();
  } else {
    emit('open-auth');
  }
});
</script>

<template>
  <div class="min-h-screen py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Unauthenticated Banner -->
    <div
      v-if="!authStore.isAuthenticated"
      class="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-lg"
    >
      <User class="w-12 h-12 text-slate-400 mx-auto mb-3" />
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Connect Your Web3 Wallet</h2>
      <p class="text-xs text-slate-500 max-w-md mx-auto mb-6">
        Sign in to view your issued China staffing contracts, review milestones, and chat with customer support.
      </p>
      <button
        type="button"
        class="px-6 py-3 rounded-2xl font-bold text-xs bg-brand-500 text-white shadow-glow-brand"
        @click="emit('open-auth')"
      >
        Sign In / Connect Wallet
      </button>
    </div>

    <div v-else class="space-y-8">
      <!-- User Identity Card -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="flex items-center space-x-4">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-cyan-500 p-0.5 shadow-glow-brand">
            <div class="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-bold text-lg">
              <User class="w-7 h-7 text-brand-400" />
            </div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-slate-900 dark:text-white">
                Client Dashboard
              </h1>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 uppercase font-mono">
                {{ authStore.user?.role || 'User' }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 flex items-center gap-1.5">
              <Wallet class="w-3.5 h-3.5 text-slate-400" />
              <span>{{ truncateAddress(authStore.user?.address || authStore.user?.email) }}</span>
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <router-link
            to="/chat"
            class="px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white flex items-center gap-1.5 transition-all"
          >
            <MessageSquare class="w-4 h-4 text-brand-500" />
            <span>Support Chat ({{ inquiries.length }})</span>
          </router-link>

          <router-link
            to="/talents"
            class="px-4 py-2.5 rounded-xl font-bold text-xs bg-brand-500 text-white hover:bg-brand-600 shadow-glow-brand flex items-center gap-1.5 transition-all"
          >
            <PlusCircle class="w-4 h-4" />
            <span>Find New Talent</span>
          </router-link>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Pending Payment (待支付)</span>
            <Clock class="w-4 h-4 text-amber-500" />
          </div>
          <div class="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
            {{ pendingContracts.length }}
          </div>
          <p class="text-[11px] text-slate-500 mt-1">Single contracts waiting for one-time checkout</p>
        </div>

        <div class="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Active in Progress (履约中)</span>
            <Shield class="w-4 h-4 text-emerald-500" />
          </div>
          <div class="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {{ activeContracts.length }}
          </div>
          <p class="text-[11px] text-slate-500 mt-1">Specialists executing assignments</p>
        </div>

        <div class="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Completed Missions (已结案)</span>
            <CheckCircle2 class="w-4 h-4 text-cyan-500" />
          </div>
          <div class="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
            {{ completedContracts.length }}
          </div>
          <p class="text-[11px] text-slate-500 mt-1">Deliverables signed off and settled</p>
        </div>
      </div>

      <!-- Contracts Section -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText class="w-5 h-5 text-brand-500" />
            <span>My Service Contracts</span>
          </h2>
          <router-link
            to="/contracts"
            class="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>View All & Pay</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <div v-if="contracts.length === 0" class="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <FileText class="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p class="text-xs text-slate-500 mb-4">No contracts found. Chat with support to draft an assignment.</p>
          <router-link
            to="/talents"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 text-white"
          >
            Browse Specialists
          </router-link>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="ctr in contracts.slice(0, 5)"
            :key="ctr.id"
            class="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
          >
            <div>
              <div class="flex items-center space-x-2 mb-1">
                <span class="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                  {{ ctr.contractNo }}
                </span>
                <span class="font-bold text-sm text-slate-900 dark:text-white">{{ ctr.title }}</span>
              </div>
              <p class="text-xs text-slate-500">
                Specialist: <strong>{{ ctr.talentName }}</strong> • {{ ctr.startDate }} ~ {{ ctr.endDate }}
              </p>
            </div>

            <div class="flex items-center space-x-4">
              <span class="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">
                {{ ctr.amount }} {{ ctr.currency }}
              </span>
              <router-link
                to="/contracts"
                class="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white transition-colors"
              >
                {{ ctr.status === 'pending_payment' ? 'Pay Now' : 'Details' }}
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
