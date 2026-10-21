<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api, type ContractItem, type OrderRecord } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { TALENT_CATEGORIES } from '@/types/categories';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
  RefreshCw,
  QrCode
} from 'lucide-vue-next';

const authStore = useAuthStore();

const contracts = ref<ContractItem[]>([]);
const isLoading = ref(true);
const activeTab = ref<'all' | 'pending' | 'active' | 'completed'>('all');

// Checkout modal state
const selectedContractForCheckout = ref<ContractItem | null>(null);
const checkoutOrder = ref<OrderRecord | null>(null);
const checkoutPayment = ref<any | null>(null);
const isCheckingOut = ref(false);
const isVerifying = ref(false);
const isCopied = ref(false);
const verifyMessage = ref('');

function getCategoryName(catId?: string): string {
  if (!catId) return '';
  const found = TALENT_CATEGORIES.find((c) => c.id === catId);
  return found ? found.name : catId;
}

async function loadContracts() {
  if (!authStore.isAuthenticated) return;
  isLoading.value = true;
  try {
    contracts.value = await api.getContracts();
  } catch (err) {
    console.error('Failed to load contracts', err);
  } finally {
    isLoading.value = false;
  }
}

const filteredContracts = computed(() => {
  if (activeTab.value === 'pending') {
    return contracts.value.filter((c) => c.status === 'pending_payment');
  }
  if (activeTab.value === 'active') {
    return contracts.value.filter((c) => c.status === 'active' || c.status === 'in_progress' || c.status === 'review');
  }
  if (activeTab.value === 'completed') {
    return contracts.value.filter((c) => c.status === 'completed');
  }
  return contracts.value;
});

async function initiateCheckout(contract: ContractItem) {
  selectedContractForCheckout.value = contract;
  isCheckingOut.value = true;
  verifyMessage.value = '';

  try {
    const res = await api.checkoutContract(contract.id);
    checkoutOrder.value = res.order;
    checkoutPayment.value = res.payment;
  } catch (err: any) {
    verifyMessage.value = err.message || 'Failed to generate payment address';
  } finally {
    isCheckingOut.value = false;
  }
}

async function verifyPayment() {
  if (!selectedContractForCheckout.value) return;
  isVerifying.value = true;
  verifyMessage.value = '';

  try {
    const res = await api.verifyContractPayment(selectedContractForCheckout.value.id);
    if (res.paid) {
      verifyMessage.value = 'Payment confirmed on-chain! Your contract is now ACTIVE.';
      setTimeout(() => {
        closeCheckoutModal();
        loadContracts();
      }, 1800);
    } else {
      verifyMessage.value = 'No incoming transaction detected yet. Please ensure funds are sent to the address below.';
    }
  } catch (err: any) {
    verifyMessage.value = err.message || 'Verification check failed';
  } finally {
    isVerifying.value = false;
  }
}

function copyAddress(address: string) {
  navigator.clipboard.writeText(address);
  isCopied.value = true;
  setTimeout(() => {
    isCopied.value = false;
  }, 2000);
}

function closeCheckoutModal() {
  selectedContractForCheckout.value = null;
  checkoutOrder.value = null;
  checkoutPayment.value = null;
  verifyMessage.value = '';
}

async function markComplete(contract: ContractItem) {
  if (!confirm(`Are you sure you want to accept all deliverables and mark contract ${contract.contractNo} as completed?`)) {
    return;
  }

  try {
    await api.completeContract(contract.id);
    loadContracts();
  } catch (err: any) {
    alert(err.message || 'Failed to complete contract');
  }
}

onMounted(() => {
  loadContracts();
});
</script>

<template>
  <div class="min-h-screen py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-8 border-b border-slate-200 dark:border-slate-800 mb-8 gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <FileText class="w-6 h-6 text-brand-500" />
          <h1 class="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
            Custom Service Contracts
          </h1>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Individual assignment contracts customized by GoChina customer support. Milestone escrow with ERC20 crypto checkout.
        </p>
      </div>

      <router-link
        to="/talents"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500 hover:text-white transition-all self-start sm:self-auto"
      >
        <span>Browse China Talents</span>
        <ArrowRight class="w-4 h-4" />
      </router-link>
    </div>

    <!-- Filter Tabs -->
    <div class="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
      <button
        v-for="tab in [
          { id: 'all', label: 'All Contracts' },
          { id: 'pending', label: 'Pending Payment' },
          { id: 'active', label: 'Active & In Progress' },
          { id: 'completed', label: 'Completed' }
        ]"
        :key="tab.id"
        type="button"
        class="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all"
        :class="activeTab === tab.id ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
        @click="activeTab = tab.id as any"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800"></div>
    </div>

    <!-- Contracts List -->
    <div v-else-if="filteredContracts.length > 0" class="space-y-6">
      <div
        v-for="contract in filteredContracts"
        :key="contract.id"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm hover:border-brand-500/30 transition-all"
      >
        <!-- Top Status Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3 mb-5">
          <div class="flex items-center space-x-3">
            <span class="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {{ contract.contractNo }}
            </span>
            <span class="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5" />
              {{ contract.startDate }} ~ {{ contract.endDate }}
            </span>
          </div>

          <!-- Status Badge -->
          <div>
            <span
              v-if="contract.status === 'pending_payment'"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
            >
              <Clock class="w-3.5 h-3.5" />
              <span>Pending Payment (待支付)</span>
            </span>
            <span
              v-else-if="contract.status === 'active' || contract.status === 'in_progress'"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            >
              <ShieldCheck class="w-3.5 h-3.5" />
              <span>Active in Progress (履约中)</span>
            </span>
            <span
              v-else-if="contract.status === 'review'"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
            >
              <AlertCircle class="w-3.5 h-3.5" />
              <span>Deliverables Ready for Review (待验收)</span>
            </span>
            <span
              v-else-if="contract.status === 'completed'"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            >
              <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
              <span>Completed & Settled (已结案)</span>
            </span>
          </div>
        </div>

        <!-- Middle Content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-3">
            <h2 class="text-xl font-bold text-slate-900 dark:text-white">
              {{ contract.title }}
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {{ contract.description }}
            </p>

            <!-- Assigned Talent Info -->
            <div class="inline-flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300">
              <User class="w-4 h-4 text-brand-500" />
              <span>履约兼职人员：<strong>{{ contract.talentName }}</strong></span>
              <span v-if="contract.category" class="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {{ getCategoryName(contract.category) }}
              </span>
            </div>

            <!-- Scope of Work Checklist -->
            <div v-if="contract.scopeOfWork && contract.scopeOfWork.length > 0" class="mt-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Scope of Work & Deliverables</h4>
              <ul class="space-y-1.5">
                <li
                  v-for="(item, idx) in contract.scopeOfWork"
                  :key="idx"
                  class="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0"></span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- Milestones Progress -->
            <div v-if="contract.milestones && contract.milestones.length > 0" class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Milestones ({{ contract.milestones.length }})</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  v-for="(ms, idx) in contract.milestones"
                  :key="ms.id"
                  class="p-2.5 rounded-xl border text-xs flex items-center justify-between"
                  :class="ms.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'"
                >
                  <div class="truncate mr-2">
                    <span class="font-bold">#{{ idx + 1 }} {{ ms.title }}</span>
                  </div>
                  <span class="font-mono font-semibold">{{ ms.amount }} {{ contract.currency }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Amount & Actions -->
          <div class="flex flex-col justify-between p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <span class="text-xs text-slate-400 font-medium block mb-1">Total Contract Value</span>
              <div class="flex items-baseline gap-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                <span>{{ contract.amount }}</span>
                <span class="text-sm text-brand-600 dark:text-brand-400 font-sans font-bold">{{ contract.currency }}</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Funds are held in non-custodial smart escrow and released upon milestone review.
              </p>
            </div>

            <div class="mt-6 space-y-2">
              <button
                v-if="contract.status === 'pending_payment'"
                type="button"
                class="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-glow-brand transition-all flex items-center justify-center gap-2"
                @click="initiateCheckout(contract)"
              >
                <DollarSign class="w-4 h-4" />
                <span>Pay Contract ({{ contract.amount }} {{ contract.currency }})</span>
              </button>

              <button
                v-if="contract.status === 'review'"
                type="button"
                class="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all flex items-center justify-center gap-2"
                @click="markComplete(contract)"
              >
                <CheckCircle2 class="w-4 h-4" />
                <span>Accept Deliverables & Settle</span>
              </button>

              <router-link
                to="/inquiries"
                class="w-full py-2 px-3 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Chat with Support about Contract</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
      <FileText class="w-12 h-12 text-slate-400 mx-auto mb-3" />
      <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">No contracts yet</h3>
      <p class="text-xs text-slate-500 max-w-sm mx-auto mb-5">
        Once you consult our support team regarding a specific specialist or assignment, your customized service contract will appear here for review and payment.
      </p>
      <router-link
        to="/talents"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-brand-500 text-white shadow-glow-brand"
      >
        <span>Browse China Specialists</span>
        <ArrowRight class="w-4 h-4" />
      </router-link>
    </div>

    <!-- Pay3 Contract Checkout Modal -->
    <div v-if="selectedContractForCheckout" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-md" @click="closeCheckoutModal" />

      <div class="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200">
        <div class="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-cyan-400 p-0.5 mx-auto mb-3 shadow-glow-brand">
            <div class="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-bold">
              Pay3
            </div>
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            Crypto Escrow Checkout
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Contract No: <span class="font-mono font-bold">{{ selectedContractForCheckout.contractNo }}</span>
          </p>
        </div>

        <div v-if="isCheckingOut" class="py-12 text-center">
          <div class="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-xs text-slate-500">Deriving unique HD wallet address on-chain...</p>
        </div>

        <div v-else-if="checkoutOrder && checkoutPayment" class="mt-5 space-y-4">
          <!-- Expected Amount Box -->
          <div class="p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl text-center">
            <span class="text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider block">Total Payable</span>
            <span class="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {{ checkoutPayment.amount }} {{ checkoutPayment.tokenSymbol }}
            </span>
          </div>

          <!-- Deposit Address -->
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1">
              Send {{ checkoutPayment.tokenSymbol }} (ERC20 / Polygon) to Address:
            </label>
            <div class="flex items-center space-x-2">
              <input
                type="text"
                readonly
                :value="checkoutPayment.receiveAddress"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-white outline-none select-all"
              />
              <button
                type="button"
                class="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
                @click="copyAddress(checkoutPayment.receiveAddress)"
              >
                <CheckCircle2 v-if="isCopied" class="w-4 h-4 text-emerald-500" />
                <Copy v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Verification Message if any -->
          <div v-if="verifyMessage" class="p-3 rounded-xl text-xs font-medium" :class="verifyMessage.includes('confirmed') ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'">
            {{ verifyMessage }}
          </div>

          <!-- Verify Button -->
          <div class="pt-2 space-y-2">
            <button
              type="button"
              :disabled="isVerifying"
              class="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              @click="verifyPayment"
            >
              <RefreshCw v-if="!isVerifying" class="w-4 h-4" />
              <span v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isVerifying ? 'Scanning Chain...' : 'I Have Paid — Verify Instant' }}</span>
            </button>

            <button
              type="button"
              class="w-full py-2 px-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-center"
              @click="closeCheckoutModal"
            >
              Close & Pay Later
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
