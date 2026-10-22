<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { api, type InquiryItem } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  Maximize2,
  FileText,
  Sparkles
} from 'lucide-vue-next';

const authStore = useAuthStore();
const isOpen = ref(false);
const activeInquiry = ref<InquiryItem | null>(null);
const inputText = ref('');
const isSending = ref(false);
const messagesBox = ref<HTMLElement | null>(null);
let pollTimer: any = null;

async function toggleChat() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    if (authStore.isAuthenticated) {
      loadLatestInquiry();
      if (!pollTimer) {
        pollTimer = setInterval(() => {
          if (isOpen.value && authStore.isAuthenticated) {
            loadLatestInquiry(true);
          }
        }, 4000);
      }
    }
  } else {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }
}

async function loadLatestInquiry(silent = false) {
  try {
    const list = await api.getInquiries();
    if (list.length > 0) {
      const prevMsgCount = activeInquiry.value?.messages?.length || 0;
      activeInquiry.value = list[0];
      if (!silent || (list[0].messages?.length || 0) > prevMsgCount) {
        scrollToBottom();
      }
    }
  } catch (err) {
    console.error('Failed to load inquiry for bubble', err);
  }
}

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});

async function sendMessage() {
  if (!inputText.value.trim() || isSending.value) return;

  const text = inputText.value.trim();
  inputText.value = '';
  isSending.value = true;

  try {
    if (!activeInquiry.value) {
      // Create first quick inquiry
      const created = await api.createInquiry({
        title: 'Live Chat Consultation',
        message: text,
        category: 'custom',
        preferredChannel: 'in_app',
      });
      activeInquiry.value = created;
    } else {
      const updated = await api.sendInquiryMessage(activeInquiry.value.id, text);
      activeInquiry.value = updated;
    }
    scrollToBottom();
  } catch (err: any) {
    alert(err.message || 'Failed to send message');
  } finally {
    isSending.value = false;
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesBox.value) {
      messagesBox.value.scrollTop = messagesBox.value.scrollHeight;
    }
  });
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-40">
    <!-- Floating Trigger Bubble -->
    <button
      v-if="!isOpen"
      type="button"
      class="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-500 to-cyan-500 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative group"
      @click="toggleChat"
    >
      <MessageCircle class="w-7 h-7" />
      <span class="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
      <!-- Tooltip -->
      <span class="absolute right-16 px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
        Chat with Support (咨询用人)
      </span>
    </button>

    <!-- Chat Popup Window -->
    <div
      v-else
      class="w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[520px] overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
    >
      <!-- Header -->
      <div class="p-4 bg-gradient-to-r from-brand-600 to-cyan-600 text-white flex items-center justify-between">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Headphones class="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 class="text-xs font-bold leading-tight">GoChina Support Agent</h4>
            <span class="text-[10px] text-white/80 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Online • Staffing & Contracts</span>
            </span>
          </div>
        </div>

        <div class="flex items-center space-x-1">
          <router-link
            to="/chat"
            class="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            title="Expand to Full Chat"
            @click="isOpen = false"
          >
            <Maximize2 class="w-4 h-4" />
          </router-link>
          <button
            type="button"
            class="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            @click="isOpen = false"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Messages Stream -->
      <div ref="messagesBox" class="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-900/50 text-xs">
        <!-- Welcoming greeting -->
        <div class="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300">
          <p class="font-bold text-brand-600 dark:text-brand-400 mb-1 flex items-center gap-1">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Welcome to GoChina</span>
          </p>
          <p class="text-[11px] leading-relaxed">
            Need an on-site factory inspector, Canton Fair interpreter, sourcing agent, or tech developer? Message us here and our team will issue your custom service contract!
          </p>
        </div>

        <template v-if="activeInquiry && activeInquiry.messages">
          <div
            v-for="m in activeInquiry.messages"
            :key="m.id"
            class="flex items-start gap-2"
            :class="m.sender === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] p-2.5 rounded-2xl text-xs"
              :class="
                m.sender === 'user'
                  ? 'bg-brand-500 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
              "
            >
              {{ m.text }}
            </div>
          </div>
        </template>
      </div>

      <!-- Attached Contract Banner if any -->
      <div
        v-if="activeInquiry && activeInquiry.contractId"
        class="px-3 py-2 bg-emerald-500 text-white text-xs flex items-center justify-between"
      >
        <span class="font-bold flex items-center gap-1">
          <FileText class="w-3.5 h-3.5" />
          <span>Contract Issued!</span>
        </span>
        <router-link
          to="/contracts"
          class="underline font-bold text-[11px]"
          @click="isOpen = false"
        >
          View & Pay
        </router-link>
      </div>

      <!-- Input Bar -->
      <div class="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form class="flex items-center space-x-2" @submit.prevent="sendMessage">
          <input
            v-model="inputText"
            type="text"
            placeholder="Type your requirements..."
            class="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            :disabled="!inputText.trim() || isSending"
            class="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50"
          >
            <Send class="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
