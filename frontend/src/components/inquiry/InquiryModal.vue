<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { api, type TalentItem } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { TALENT_CATEGORIES } from '@/types/categories';
import { X, Send, Sparkles, MessageSquare, CheckCircle, ExternalLink, HelpCircle } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  talent?: TalentItem | null;
  initialCategory?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', inquiryId: string): void;
  (e: 'open-auth'): void;
}>();

const authStore = useAuthStore();

const selectedCategory = ref<string>('driver');
const title = ref('');
const message = ref('');
const budget = ref('');
const expectedDuration = ref('');
const preferredChannel = ref<'in_app' | 'telegram' | 'whatsapp' | 'wechat'>('in_app');
const contactInfo = ref('');
const isSubmitting = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

// Synchronize category on prop changes
watch(
  () => [props.isOpen, props.talent, props.initialCategory],
  () => {
    if (props.talent?.category) {
      selectedCategory.value = props.talent.category;
    } else if (props.initialCategory) {
      selectedCategory.value = props.initialCategory;
    }
  },
  { immediate: true }
);

const currentCategoryMeta = computed(() => {
  return TALENT_CATEGORIES.find((c) => c.id === selectedCategory.value) || null;
});

// Pre-fill title when category or talent changes
const computedPlaceholder = computed(() => {
  if (props.talent) {
    return `Inquiry for ${props.talent.name} (${currentCategoryMeta.value?.name || props.talent.category})`;
  }
  if (currentCategoryMeta.value) {
    return `【${currentCategoryMeta.value.name}】需求对接与定制订单洽谈`;
  }
  return 'e.g. 3-Day Business Car Rental & Escrow Contract';
});

async function handleSubmit() {
  if (!authStore.isAuthenticated) {
    emit('open-auth');
    return;
  }

  const finalTitle = title.value.trim() || computedPlaceholder.value;
  if (!message.value.trim()) {
    errorMsg.value = 'Please describe your requirements (dates, location, details).';
    return;
  }

  isSubmitting.value = true;
  errorMsg.value = '';

  try {
    const inquiry = await api.createInquiry({
      talentId: props.talent?.id,
      talentName: props.talent?.name,
      category: selectedCategory.value,
      title: finalTitle,
      message: message.value.trim(),
      budget: budget.value.trim() || undefined,
      expectedDuration: expectedDuration.value.trim() || undefined,
      preferredChannel: preferredChannel.value,
      contactInfo: contactInfo.value.trim() || undefined,
    });

    successMsg.value = '需求已成功提交！客服将与您对接细节并统筹兼职排期，整好定制订单。';
    setTimeout(() => {
      emit('success', inquiry.id);
      emit('close');
      resetForm();
    }, 1500);
  } catch (err: any) {
    errorMsg.value = err.message || 'Failed to submit inquiry';
  } finally {
    isSubmitting.value = false;
  }
}

function resetForm() {
  title.value = '';
  message.value = '';
  budget.value = '';
  expectedDuration.value = '';
  contactInfo.value = '';
  errorMsg.value = '';
  successMsg.value = '';
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-md" @click="emit('close')" />

    <!-- Modal Dialog -->
    <div
      class="relative w-full max-w-xl my-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-500">
            <MessageSquare class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">
              {{ talent ? `按类别洽谈兼职需求 (${currentCategoryMeta?.name || talent.category})` : '人才类别用人对接与定制订单' }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              平台严选兼职派单 • 与客服沟通确认细节 • 客服统筹排期并整好订单
            </p>
          </div>
        </div>
        <button
          type="button"
          class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Business Logic Notice Banner -->
      <div class="mt-4 p-3 bg-brand-50/70 dark:bg-brand-950/30 rounded-2xl border border-brand-500/20 text-xs text-brand-700 dark:text-brand-300 flex items-start gap-2.5">
        <HelpCircle class="w-4 h-4 shrink-0 text-brand-500 mt-0.5" />
        <div class="leading-relaxed">
          <strong>服务流程提示：</strong>本平台所有服务人员均为签约严选兼职。客户统一按<strong>人才类别</strong>（如司机带车、导游、程序员、中文老师等）对接。客服将与您沟通具体时间、地点与技术要求，统筹排期后为您<strong>整好并生成定制订单</strong>，确认无误后再进行加密支付。
        </div>
      </div>

      <!-- Talent Showcase Reference Card if clicked from showcase -->
      <div
        v-if="talent"
        class="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center space-x-3"
      >
        <img :src="talent.avatar" class="w-11 h-11 rounded-xl object-cover border border-brand-500/30" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-xs text-slate-900 dark:text-white">{{ talent.name }}</span>
              <span class="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-medium">示例展示专家</span>
            </div>
            <span class="text-xs font-mono font-semibold text-brand-600 dark:text-brand-400">{{ talent.hourlyRate }}</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">{{ talent.title }} • {{ talent.location }}</p>
        </div>
      </div>

      <!-- Form Body -->
      <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
        <!-- Category Selection -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            人才服务类别 (Service Category)
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="cat in TALENT_CATEGORIES"
              :key="cat.id"
              type="button"
              class="px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition-all"
              :class="selectedCategory === cat.id ? 'bg-brand-500 text-white border-brand-500 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-brand-500/50'"
              @click="selectedCategory = cat.id"
            >
              <div class="font-bold truncate">{{ cat.name }}</div>
              <div class="text-[10px] opacity-75 truncate">{{ cat.priceGuide }}</div>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            需求标题 (Assignment Title)
          </label>
          <input
            v-model="title"
            type="text"
            :placeholder="computedPlaceholder"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            具体需求细节与时间地点 (Requirements & Schedule)
          </label>
          <textarea
            v-model="message"
            rows="3"
            placeholder="请详细说明您的需求：如出行城市、接送时间、用车要求（司机带车）；行程天数与景点意向（导游）；开发语言与技术要求（程序员）；学习目标与基础（中文老师）等..."
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none"
            required
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              预估服务周期 / 课时 / 天数
            </label>
            <input
              v-model="expectedDuration"
              type="text"
              placeholder="例如：3天 / 10课时 / 2周"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              期望预算范围 (USDT)
            </label>
            <input
              v-model="budget"
              type="text"
              placeholder="例如：500 USDT"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            首选客服沟通渠道 (Preferred Support Channel)
          </label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="ch in [
                { id: 'in_app', label: '站内工单聊天' },
                { id: 'telegram', label: 'Telegram' },
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'wechat', label: '微信 WeChat' }
              ]"
              :key="ch.id"
              type="button"
              class="py-2 px-1 rounded-xl text-xs font-semibold border text-center transition-all truncate"
              :class="preferredChannel === ch.id ? 'bg-brand-500 text-white border-brand-500 shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'"
              @click="preferredChannel = ch.id as any"
            >
              {{ ch.label }}
            </button>
          </div>
        </div>

        <div v-if="preferredChannel !== 'in_app'">
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
            您的 {{ preferredChannel.toUpperCase() }} 账号或手机号
          </label>
          <input
            v-model="contactInfo"
            type="text"
            :placeholder="`例如：@username 或 +86 13800000000`"
            class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div v-if="errorMsg" class="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-xl">
          {{ errorMsg }}
        </div>

        <div v-if="successMsg" class="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle class="w-4 h-4 shrink-0" />
          <span>{{ successMsg }}</span>
        </div>

        <div class="pt-2 flex items-center justify-between">
          <a
            href="https://t.me/GoChinaSupport"
            target="_blank"
            class="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            <span>直接联系 Telegram 客服</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </a>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-glow-brand flex items-center space-x-2 disabled:opacity-50"
          >
            <Send v-if="!isSubmitting" class="w-4 h-4" />
            <span v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isSubmitting ? '提交中...' : '提交客服整好订单' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
