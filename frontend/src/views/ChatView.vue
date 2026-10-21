<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { api, type InquiryItem, type InquiryMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import {
  MessageSquare,
  Send,
  User,
  Headphones,
  Clock,
  CheckCircle,
  FileText,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-vue-next';

const route = useRoute();
const authStore = useAuthStore();

const inquiries = ref<InquiryItem[]>([]);
const activeInquiryId = ref<string | null>(null);
const isLoading = ref(true);
const isSending = ref(false);
const inputText = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

// New inquiry modal state
const showNewInquiryModal = ref(false);
const newTitle = ref('');
const newMessage = ref('');
const newCategory = ref('driver');
const newBudget = ref('');

let pollTimer: any = null;

const activeInquiry = computed(() => {
  return inquiries.value.find((i) => i.id === activeInquiryId.value) || null;
});

async function loadInquiries(silent = false) {
  if (!authStore.isAuthenticated) return;
  if (!silent) isLoading.value = true;

  try {
    const list = await api.getInquiries();
    inquiries.value = list;

    // If query has id, select it
    if (route.query.id && list.some((i) => i.id === route.query.id)) {
      activeInquiryId.value = String(route.query.id);
    } else if (!activeInquiryId.value && list.length > 0) {
      activeInquiryId.value = list[0].id;
    }

    scrollToBottom();
  } catch (err) {
    console.error('Failed to load inquiries', err);
  } finally {
    if (!silent) isLoading.value = false;
  }
}

function selectInquiry(id: string) {
  activeInquiryId.value = id;
  scrollToBottom();
}

async function sendMessage() {
  if (!activeInquiryId.value || !inputText.value.trim() || isSending.value) return;

  const text = inputText.value.trim();
  inputText.value = '';
  isSending.value = true;

  try {
    const updated = await api.sendInquiryMessage(activeInquiryId.value, text);
    const index = inquiries.value.findIndex((i) => i.id === updated.id);
    if (index !== -1) {
      inquiries.value[index] = updated;
    }
    scrollToBottom();
  } catch (err: any) {
    alert(err.message || 'Failed to send message');
  } finally {
    isSending.value = false;
  }
}

async function handleCreateNewInquiry() {
  if (!newTitle.value.trim() || !newMessage.value.trim()) return;

  try {
    const created = await api.createInquiry({
      title: newTitle.value.trim(),
      message: newMessage.value.trim(),
      category: newCategory.value,
      budget: newBudget.value.trim() || undefined,
      preferredChannel: 'in_app',
    });

    inquiries.value.unshift(created);
    activeInquiryId.value = created.id;
    showNewInquiryModal.value = false;
    newTitle.value = '';
    newMessage.value = '';
    newBudget.value = '';
    scrollToBottom();
  } catch (err: any) {
    alert(err.message || 'Failed to create inquiry');
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function formatTime(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function sendQuickPrompt(promptText: string) {
  inputText.value = promptText;
  sendMessage();
}

onMounted(() => {
  loadInquiries();
  // Poll for agent messages every 4 seconds
  pollTimer = setInterval(() => {
    loadInquiries(true);
  }, 4000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <div class="min-h-screen py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-6">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <Headphones class="w-6 h-6 text-brand-500" />
          <h1 class="text-2xl font-display font-extrabold text-slate-900 dark:text-white">
            Support Chat & Contract Consultation
          </h1>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Chat directly with GoChina support agents to specify staffing requirements and receive custom contracts.
        </p>
      </div>

      <button
        type="button"
        class="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-glow-brand flex items-center gap-1.5 transition-all"
        @click="showNewInquiryModal = true"
      >
        <Plus class="w-4 h-4" />
        <span>New Staffing Consultation</span>
      </button>
    </div>

    <!-- Main Chat Workspace -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[750px]">
      <!-- Left Column: Conversations List -->
      <div class="border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50">
        <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Consultations ({{ inquiries.length }})
          </span>
          <button
            type="button"
            class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            title="Refresh"
            @click="loadInquiries()"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          <div
            v-if="inquiries.length === 0"
            class="p-8 text-center text-slate-400 text-xs"
          >
            No consultations yet. Click "New Staffing Consultation" above to talk with support.
          </div>

          <div
            v-for="inq in inquiries"
            :key="inq.id"
            class="p-4 cursor-pointer transition-colors relative"
            :class="activeInquiryId === inq.id ? 'bg-white dark:bg-slate-800 shadow-sm border-l-4 border-brand-500' : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'"
            @click="selectInquiry(inq.id)"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                {{ inq.title }}
              </span>
              <span class="text-[10px] text-slate-400">
                {{ formatTime(inq.updated_at) }}
              </span>
            </div>

            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
              {{ inq.messages && inq.messages.length > 0 ? inq.messages[inq.messages.length - 1].text : inq.message }}
            </p>

            <div class="flex items-center justify-between text-[10px]">
              <span
                v-if="inq.contractId"
                class="px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
              >
                <FileText class="w-3 h-3" />
                <span>Contract Ready</span>
              </span>
              <span
                v-else-if="inq.status === 'in_progress'"
                class="px-2 py-0.5 rounded-full font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400"
              >
                Agent In Chat
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                Awaiting Agent
              </span>

              <span v-if="inq.talentName" class="text-slate-400 truncate max-w-[90px]">
                {{ inq.talentName }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Area: Live Chat Stream -->
      <div class="md:col-span-2 lg:col-span-3 flex flex-col h-full bg-white dark:bg-slate-900">
        <!-- Active Chat Header -->
        <div v-if="activeInquiry" class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="relative">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-cyan-500 p-0.5">
                <div class="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white">
                  <Headphones class="w-5 h-5 text-brand-400" />
                </div>
              </div>
              <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500"></span>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">
                {{ activeInquiry.title }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>GoChina Customer Support Specialist</span>
                <span>•</span>
                <span class="text-emerald-500 font-semibold">Online & Monitoring</span>
              </p>
            </div>
          </div>

          <!-- Go to Contract Banner if exists -->
          <router-link
            v-if="activeInquiry.contractId"
            to="/contracts"
            class="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <FileText class="w-3.5 h-3.5" />
            <span>View Issued Contract</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </router-link>
        </div>

        <!-- Contract Offer Alert Box inside Chat -->
        <div
          v-if="activeInquiry && activeInquiry.contractId"
          class="m-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center justify-between"
        >
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <ShieldCheck class="w-6 h-6" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                Official Service Contract Issued!
              </h4>
              <p class="text-xs text-emerald-600 dark:text-emerald-400">
                Our support agent has drafted and attached your custom one-time labor contract. You can review the scope and pay via USDT.
              </p>
            </div>
          </div>
          <router-link
            to="/contracts"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm"
          >
            Review & Pay Now
          </router-link>
        </div>

        <!-- Messages Stream -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          <div v-if="!activeInquiry" class="h-full flex items-center justify-center text-slate-400 text-sm">
            Select a consultation on the left or start a new inquiry.
          </div>

          <template v-else-if="activeInquiry.messages && activeInquiry.messages.length > 0">
            <!-- System Welcome Message -->
            <div class="text-center my-2">
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <Sparkles class="w-3 h-3 text-brand-500" />
                <span>Consultation started on {{ new Date(activeInquiry.created_at || Date.now()).toLocaleDateString() }}</span>
              </span>
            </div>

            <!-- Messages List -->
            <div
              v-for="msg in activeInquiry.messages"
              :key="msg.id"
              class="flex items-start gap-2.5"
              :class="msg.sender === 'user' ? 'justify-end' : 'justify-start'"
            >
              <!-- Agent Avatar -->
              <div
                v-if="msg.sender !== 'user'"
                class="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 mt-0.5"
              >
                <Headphones class="w-4 h-4" />
              </div>

              <!-- Message Bubble -->
              <div
                class="max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed"
                :class="
                  msg.sender === 'user'
                    ? 'bg-brand-500 text-white rounded-tr-none shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-200/80 dark:border-slate-700/60'
                "
              >
                <div class="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                  <span class="font-bold">{{ msg.senderName || (msg.sender === 'user' ? 'You' : 'GoChina Support') }}</span>
                  <span>{{ formatTime(msg.timestamp) }}</span>
                </div>
                <p class="whitespace-pre-wrap">{{ msg.text }}</p>
              </div>

              <!-- User Avatar -->
              <div
                v-if="msg.sender === 'user'"
                class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5"
              >
                <User class="w-4 h-4" />
              </div>
            </div>
          </template>
        </div>

        <!-- Quick Prompts Bar -->
        <div v-if="activeInquiry" class="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <span class="text-slate-400 shrink-0 font-medium">Quick Replies:</span>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-500 hover:text-white whitespace-nowrap transition-colors"
            @click="sendQuickPrompt('Can you draft a contract for this assignment?')"
          >
            Please draft a contract
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-500 hover:text-white whitespace-nowrap transition-colors"
            @click="sendQuickPrompt('What is the earliest date this specialist can start on-site?')"
          >
            When can they start on-site?
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-500 hover:text-white whitespace-nowrap transition-colors"
            @click="sendQuickPrompt('Do you accept payment via USDT on Polygon or Ethereum?')"
          >
            USDT payment confirmation
          </button>
        </div>

        <!-- Message Input Bar -->
        <div v-if="activeInquiry" class="p-4 border-t border-slate-200 dark:border-slate-800">
          <form class="flex items-center space-x-2" @submit.prevent="sendMessage">
            <input
              v-model="inputText"
              type="text"
              placeholder="Type your message to GoChina support agent (e.g. adjust work scope, confirm start date)..."
              class="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              :disabled="isSending"
            />
            <button
              type="submit"
              :disabled="!inputText.trim() || isSending"
              class="px-5 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-glow-brand transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Send class="w-4 h-4" />
              <span class="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- New Inquiry Dialog -->
    <div v-if="showNewInquiryModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-md" @click="showNewInquiryModal = false" />
      <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 z-10 shadow-2xl">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Start New Staffing Consultation
        </h3>
        <p class="text-xs text-slate-500 mb-4">
          Tell us about the Chinese professional or work scope you need arranged.
        </p>

        <form class="space-y-4" @submit.prevent="handleCreateNewInquiry">
          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">人才服务类别 (Service Category)</label>
            <select
              v-model="newCategory"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
            >
              <option value="driver">🚗 司机带车 (Driver with Vehicle)</option>
              <option value="guide">🧭 私人导游 (Tour Guide & Companion)</option>
              <option value="tech">💻 程序员技术开发 (Programmer & Cloud Dev)</option>
              <option value="chinese_tutor">📖 中文老师私教 (Mandarin Chinese Tutor)</option>
              <option value="translation">🌐 商务翻译与展会陪同 (Business Interpreter)</option>
              <option value="inspection">🔍 验厂验货与品质监督 (Factory Audit & QC)</option>
              <option value="concierge">🏢 本地代办与商务秘书 (Corporate Concierge)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Assignment Subject</label>
            <input
              v-model="newTitle"
              type="text"
              placeholder="e.g. 2 Days Container Loading Inspection in Ningbo"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Specific Scope & Requirements</label>
            <textarea
              v-model="newMessage"
              rows="3"
              placeholder="Detail your requirements, factory location, products, or timeline..."
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none resize-none"
              required
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Target Budget (USDT)</label>
            <input
              v-model="newBudget"
              type="text"
              placeholder="e.g. 500 USDT"
              class="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div class="pt-2 flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
              @click="showNewInquiryModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2 rounded-xl text-xs font-bold bg-brand-500 text-white shadow-glow-brand"
            >
              Start Chat with Support
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
