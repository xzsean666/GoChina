<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import {
  api,
  type OrderRecord,
  type InquiryItem,
  type ContractItem,
  type TalentItem
} from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import OrderAuditTable from '@/components/admin/OrderAuditTable.vue';
import { TALENT_CATEGORIES } from '@/types/categories';
import {
  ShieldAlert,
  MessageSquare,
  FileText,
  Receipt,
  RefreshCw,
  Plus,
  Send,
  User,
  CheckCircle2,
  Calendar,
  DollarSign,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-vue-next';

const authStore = useAuthStore();
const { toast } = useToast();

const activeTab = ref<'inquiries' | 'contracts' | 'orders'>('inquiries');
const isLoading = ref(false);

// Inquiries state
const inquiries = ref<InquiryItem[]>([]);
const selectedInquiry = ref<InquiryItem | null>(null);
const replyText = ref('');
const isReplying = ref(false);

// Contracts state
const contracts = ref<ContractItem[]>([]);
const talents = ref<TalentItem[]>([]);
const isDraftModalOpen = ref(false);

// Draft Contract Form
const draftUserId = ref('');
const draftUserEmail = ref('');
const draftInquiryId = ref('');
const draftCategory = ref('driver');
const draftTalentId = ref('');
const draftTalentName = ref('');
const draftTitle = ref('');
const draftDescription = ref('');
const draftScopeText = ref('');
const draftAmount = ref('');
const draftStartDate = ref(new Date().toISOString().slice(0, 10));
const draftEndDate = ref(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
const isDrafting = ref(false);

function getCategoryName(catId?: string): string {
  if (!catId) return '定制服务';
  const found = TALENT_CATEGORIES.find((c) => c.id === catId);
  return found ? found.name : catId;
}

// Orders state
const orders = ref<OrderRecord[]>([]);
const nextCursor = ref<string | undefined>(undefined);
let pollTimer: any = null;

onMounted(async () => {
  if (authStore.isAdmin) {
    await reloadData();
    talents.value = await api.getTalents();

    pollTimer = setInterval(async () => {
      if (activeTab.value === 'inquiries' && authStore.isAdmin) {
        try {
          const list = await api.getInquiries();
          inquiries.value = list;
          if (selectedInquiry.value) {
            const updated = list.find((i) => i.id === selectedInquiry.value?.id);
            if (updated) {
              selectedInquiry.value = updated;
            }
          }
        } catch {
          // silent fail in background poll
        }
      }
    }, 4000);
  }
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});

async function reloadData() {
  isLoading.value = true;
  try {
    if (activeTab.value === 'inquiries') {
      inquiries.value = await api.getInquiries();
      if (!selectedInquiry.value && inquiries.value.length > 0) {
        selectedInquiry.value = inquiries.value[0];
      }
    } else if (activeTab.value === 'contracts') {
      contracts.value = await api.getContracts();
    } else {
      const res = await api.getAdminOrders().catch(() => ({ orders: [], nextCursor: undefined }));
      orders.value = res.orders;
      nextCursor.value = res.nextCursor;
    }
  } finally {
    isLoading.value = false;
  }
}

function handleTabChange(tab: 'inquiries' | 'contracts' | 'orders') {
  activeTab.value = tab;
  reloadData();
}

async function sendAgentReply() {
  if (!selectedInquiry.value || !replyText.value.trim() || isReplying.value) return;

  const text = replyText.value.trim();
  replyText.value = '';
  isReplying.value = true;

  try {
    const updated = await api.sendInquiryMessage(selectedInquiry.value.id, text);
    selectedInquiry.value = updated;
    const idx = inquiries.value.findIndex((i) => i.id === updated.id);
    if (idx !== -1) {
      inquiries.value[idx] = updated;
    }
    toast.success('Reply Sent', 'Your message was delivered to the customer in-app.');
  } catch (err: any) {
    toast.error('Failed to reply', err.message);
  } finally {
    isReplying.value = false;
  }
}

function openDraftModalFromInquiry(inq: InquiryItem) {
  draftInquiryId.value = inq.id;
  draftUserId.value = inq.userId;
  draftUserEmail.value = inq.userEmail;
  draftCategory.value = inq.category || 'driver';
  draftTalentId.value = inq.talentId || (talents.value[0]?.id || 'tal_master_zhang');
  const matchedTalent = talents.value.find((t) => t.id === draftTalentId.value);
  draftTalentName.value = matchedTalent?.name || inq.talentName || '平台严选兼职专家';
  draftTitle.value = inq.title.startsWith('【') ? inq.title : `【${getCategoryName(draftCategory.value)}】${inq.title}`;
  draftDescription.value = inq.message;
  draftScopeText.value = `- 客户对接与兼职人员时间排期确认\n- 现场/线上按约定标准实施履约\n- 交付验收与成果报告签署确认`;
  draftAmount.value = inq.budget ? inq.budget.replace(/[^0-9.]/g, '') || '500.00' : '500.00';
  isDraftModalOpen.value = true;
}

function openNewDraftModal() {
  draftInquiryId.value = '';
  draftUserId.value = '';
  draftUserEmail.value = '';
  draftCategory.value = 'driver';
  draftTalentId.value = talents.value[0]?.id || 'tal_master_zhang';
  draftTalentName.value = talents.value[0]?.name || '平台严选兼职专家';
  draftTitle.value = '';
  draftDescription.value = '';
  draftScopeText.value = '';
  draftAmount.value = '500.00';
  isDraftModalOpen.value = true;
}

function handleTalentChange() {
  const t = talents.value.find((item) => item.id === draftTalentId.value);
  if (t) {
    draftTalentName.value = t.name;
  }
}

async function handleCreateContract() {
  if (!draftUserId.value || !draftTalentId.value || !draftAmount.value || !draftTitle.value) {
    toast.error('Validation Error', 'Customer ID, Talent, Title, and Amount are required.');
    return;
  }

  isDrafting.value = true;
  try {
    const scopeItems = draftScopeText.value
      .split('\n')
      .map((s) => s.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean);

    const created = await api.createContract({
      userId: draftUserId.value,
      userEmail: draftUserEmail.value,
      category: draftCategory.value,
      talentId: draftTalentId.value,
      talentName: draftTalentName.value,
      inquiryId: draftInquiryId.value || undefined,
      title: draftTitle.value,
      description: draftDescription.value,
      scopeOfWork: scopeItems,
      startDate: draftStartDate.value,
      endDate: draftEndDate.value,
      amount: draftAmount.value,
      currency: 'USDT',
      milestones: [
        {
          title: 'Full Deliverable Completion',
          description: 'Execution of complete scope of work and final report',
          amount: draftAmount.value,
        },
      ],
    });

    toast.success('Contract Issued', `Contract ${created.contractNo} has been issued to user ${draftUserEmail.value || draftUserId.value}.`);
    isDraftModalOpen.value = false;
    reloadData();
  } catch (err: any) {
    toast.error('Failed to create contract', err.message);
  } finally {
    isDrafting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Admin Warning Banner -->
    <div class="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <ShieldAlert class="w-5 h-5 shrink-0" />
        <span class="text-xs sm:text-sm font-semibold">
          Customer Support & Contract Desk • Admin Authority Active
        </span>
      </div>
      <button
        type="button"
        class="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
        @click="reloadData"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
        <span>Sync</span>
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
      <div class="flex items-center space-x-2">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
          :class="activeTab === 'inquiries' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
          @click="handleTabChange('inquiries')"
        >
          <MessageSquare class="w-4 h-4" />
          <span>Customer Inquiries ({{ inquiries.length }})</span>
        </button>

        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
          :class="activeTab === 'contracts' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
          @click="handleTabChange('contracts')"
        >
          <FileText class="w-4 h-4" />
          <span>Contracts & Drafting ({{ contracts.length }})</span>
        </button>

        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
          :class="activeTab === 'orders' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
          @click="handleTabChange('orders')"
        >
          <Receipt class="w-4 h-4" />
          <span>Pay3 Crypto Orders</span>
        </button>
      </div>

      <button
        v-if="activeTab === 'contracts' || activeTab === 'inquiries'"
        type="button"
        class="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm flex items-center gap-1.5"
        @click="openNewDraftModal"
      >
        <Plus class="w-4 h-4" />
        <span>Draft New Contract</span>
      </button>
    </div>

    <!-- Tab 1: Inquiries & Live Chat Desk -->
    <div v-if="activeTab === 'inquiries'" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[720px]">
      <!-- Left: Inquiries list -->
      <div class="border-r border-slate-200 dark:border-slate-800 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
        <div
          v-for="inq in inquiries"
          :key="inq.id"
          class="p-4 cursor-pointer transition-colors"
          :class="selectedInquiry?.id === inq.id ? 'bg-white dark:bg-slate-800 border-l-4 border-brand-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'"
          @click="selectedInquiry = inq"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
              {{ inq.title }}
            </span>
            <span class="text-[10px] text-slate-400 font-mono">
              {{ inq.budget || 'Custom' }}
            </span>
          </div>
          <p class="text-xs text-slate-500 line-clamp-1 mb-2">{{ inq.message }}</p>
          <div class="flex items-center justify-between text-[10px]">
            <span class="font-mono text-slate-400">{{ inq.userEmail || inq.userId }}</span>
            <span v-if="inq.contractId" class="text-emerald-500 font-bold">Contract Issued</span>
          </div>
        </div>
      </div>

      <!-- Right: Chat & Quick Contract Action -->
      <div class="md:col-span-2 lg:col-span-3 flex flex-col h-full bg-white dark:bg-slate-900">
        <div v-if="selectedInquiry" class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ selectedInquiry.title }}</h3>
            <p class="text-xs text-slate-500">
              Customer: <span class="font-mono font-bold">{{ selectedInquiry.userEmail || selectedInquiry.userId }}</span>
              <span v-if="selectedInquiry.talentName"> • Target Talent: {{ selectedInquiry.talentName }}</span>
            </p>
          </div>

          <button
            type="button"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-500 text-white hover:bg-brand-600 transition-all flex items-center gap-1.5"
            @click="openDraftModalFromInquiry(selectedInquiry)"
          >
            <FileText class="w-3.5 h-3.5" />
            <span>Draft Contract For This User</span>
          </button>
        </div>

        <!-- Messages stream -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <template v-if="selectedInquiry && selectedInquiry.messages">
            <div
              v-for="msg in selectedInquiry.messages"
              :key="msg.id"
              class="flex items-start gap-2.5"
              :class="msg.sender === 'agent' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[75%] rounded-2xl p-3 text-xs sm:text-sm"
                :class="
                  msg.sender === 'agent'
                    ? 'bg-brand-500 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-200 dark:border-slate-700'
                "
              >
                <div class="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                  <span class="font-bold">{{ msg.senderName || msg.sender }}</span>
                  <span>{{ new Date(msg.timestamp).toLocaleTimeString() }}</span>
                </div>
                <p class="whitespace-pre-wrap">{{ msg.text }}</p>
              </div>
            </div>
          </template>
        </div>

        <!-- Reply Input -->
        <div v-if="selectedInquiry" class="p-4 border-t border-slate-200 dark:border-slate-800">
          <form class="flex items-center space-x-2" @submit.prevent="sendAgentReply">
            <input
              v-model="replyText"
              type="text"
              placeholder="Reply to customer as GoChina Support..."
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              :disabled="isReplying"
            />
            <button
              type="submit"
              :disabled="!replyText.trim() || isReplying"
              class="px-4 py-2.5 rounded-xl font-bold text-xs bg-brand-500 text-white disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send class="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Tab 2: Contracts List -->
    <div v-else-if="activeTab === 'contracts'" class="space-y-4">
      <div v-if="contracts.length === 0" class="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
        No contracts issued yet. Click "Draft New Contract" to create one.
      </div>

      <div
        v-for="ctr in contracts"
        :key="ctr.id"
        class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
      >
        <div class="space-y-1">
          <div class="flex items-center space-x-3">
            <span class="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {{ ctr.contractNo }}
            </span>
            <span class="font-bold text-sm text-slate-900 dark:text-white">{{ ctr.title }}</span>
          </div>
          <p class="text-xs text-slate-500">
            Client: <span class="font-mono">{{ ctr.userEmail || ctr.userId }}</span> • Assigned: <strong>{{ ctr.talentName }}</strong>
          </p>
          <div class="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Period: {{ ctr.startDate }} ~ {{ ctr.endDate }}</span>
            <span>•</span>
            <span class="font-mono font-bold text-brand-600 dark:text-brand-400">{{ ctr.amount }} {{ ctr.currency }} (One-time)</span>
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <span
            class="px-3 py-1 rounded-full text-xs font-bold"
            :class="
              ctr.status === 'active' || ctr.status === 'in_progress'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : ctr.status === 'completed'
                ? 'bg-slate-100 text-slate-600'
                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
            "
          >
            {{ ctr.status.toUpperCase() }}
          </span>
        </div>
      </div>
    </div>

    <!-- Tab 3: Pay3 Orders -->
    <div v-else-if="activeTab === 'orders'">
      <OrderAuditTable
        :orders="orders"
        :is-loading="isLoading"
        :has-more="Boolean(nextCursor)"
        @load-more="reloadData"
      />
    </div>

    <!-- Draft Contract Dialog -->
    <div v-if="isDraftModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-md" @click="isDraftModalOpen = false" />
      <div class="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">
          客服整单：拟定兼职服务定制订单 / 合约
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          平台人员均为严选兼职。与客户沟通确认需求后，在此整好订单并派发给客户完成链上支付。
        </p>

        <div class="mb-4 p-3 bg-brand-500/10 border border-brand-500/20 rounded-2xl text-xs text-brand-700 dark:text-brand-300">
          💡 <strong>兼职派单整合：</strong>与客户沟通确认时间地点、用车或技术要求后，在此为用户整好定制订单并下发。
        </div>

        <form class="space-y-4" @submit.prevent="handleCreateContract">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Customer User ID</label>
              <input
                v-model="draftUserId"
                type="text"
                placeholder="usr_xxx"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Customer Email</label>
              <input
                v-model="draftUserEmail"
                type="text"
                placeholder="buyer@corp.com"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <!-- Service Category Selection -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">人才服务类别 (Service Category)</label>
            <select
              v-model="draftCategory"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
            >
              <option v-for="cat in TALENT_CATEGORIES" :key="cat.id" :value="cat.id">
                {{ cat.name }} ({{ cat.nameEn }}) — 参考：{{ cat.priceGuide }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">匹配/指派兼职人员 (Assigned Freelancer)</label>
            <select
              v-model="draftTalentId"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
              @change="handleTalentChange"
            >
              <option v-for="t in talents" :key="t.id" :value="t.id">
                {{ t.name }} — {{ t.title }} ({{ t.hourlyRate }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Contract Title</label>
            <input
              v-model="draftTitle"
              type="text"
              placeholder="e.g. 3-Day Ningbo Factory Quality & Component Inspection"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Detailed Objectives & Scope</label>
            <textarea
              v-model="draftDescription"
              rows="2"
              placeholder="Summarize the core goal of the assignment..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none resize-none"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Deliverables List (One per line)</label>
            <textarea
              v-model="draftScopeText"
              rows="3"
              placeholder="- Day 1: On-site verification&#10;- Day 2: PCB testing report&#10;- Day 3: Video sign-off"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none"
            ></textarea>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Total Fee (USDT)</label>
              <input
                v-model="draftAmount"
                type="text"
                placeholder="800.00"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none font-mono font-bold"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Start Date</label>
              <input
                v-model="draftStartDate"
                type="date"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">End Date</label>
              <input
                v-model="draftEndDate"
                type="date"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              @click="isDraftModalOpen = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isDrafting"
              class="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>{{ isDrafting ? '整单下发中...' : '整好并发布定制订单' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
