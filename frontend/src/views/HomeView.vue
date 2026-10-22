<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api, type TalentItem } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useI18n } from '@/composables/useI18n';
import InquiryModal from '@/components/inquiry/InquiryModal.vue';
import { TALENT_CATEGORIES } from '@/types/categories';
import {
  Users,
  MessageSquare,
  ShieldCheck,
  FileCheck2,
  DollarSign,
  ArrowRight,
  Star,
  MapPin,
  CheckCircle,
  Briefcase,
  Globe2,
  Building2,
  Lock,
  Headphones,
  Check,
  Car,
  Compass,
  Code,
  BookOpen,
  Languages,
  Building,
  Sparkles,
  Info
} from 'lucide-vue-next';

defineProps<{
  onOpenAuth?: () => void;
}>();

const emit = defineEmits<{
  (e: 'open-auth'): void;
}>();

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const featuredTalents = ref<TalentItem[]>([]);
const isLoading = ref(true);
const isModalOpen = ref(false);
const selectedTalent = ref<TalentItem | null>(null);
const selectedCategoryForInquiry = ref<string>('driver');

function getCategoryIcon(catId: string) {
  switch (catId) {
    case 'driver': return Car;
    case 'guide': return Compass;
    case 'tech': return Code;
    case 'chinese_tutor': return BookOpen;
    case 'translation': return Languages;
    case 'inspection': return ShieldCheck;
    case 'concierge': return Building;
    default: return Briefcase;
  }
}

async function loadTalents() {
  try {
    const list = await api.getTalents(undefined, undefined);
    featuredTalents.value = list.slice(0, 4);
  } catch (err) {
    console.error('Failed to load featured talents', err);
  } finally {
    isLoading.value = false;
  }
}

function openInquiryForCategory(catId: string) {
  selectedTalent.value = null;
  selectedCategoryForInquiry.value = catId;
  isModalOpen.value = true;
}

function openInquiryForTalent(talent?: TalentItem) {
  selectedTalent.value = talent || null;
  selectedCategoryForInquiry.value = talent?.category || 'driver';
  isModalOpen.value = true;
}

function handleInquirySuccess(inquiryId: string) {
  router.push({ path: '/chat', query: { id: inquiryId } });
}

onMounted(() => {
  loadTalents();
});
</script>

<template>
  <div class="relative overflow-hidden">
    <!-- Hero Section -->
    <section class="relative pt-12 pb-20 sm:pt-20 sm:pb-28">
      <!-- Background Ambient Glow -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Hero Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-6 shadow-sm">
          <Users class="w-4 h-4 text-brand-500" />
          <span>{{ t('hero.badge') }}</span>
        </div>

        <!-- Main Title -->
        <h1 class="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight mb-6">
          按人才类别对接，由客服为您
          <span class="bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 bg-clip-text text-transparent">
            整好专属定制订单
          </span>
        </h1>

        <!-- Subtitle -->
        <p class="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-8">
          涵盖<strong>司机带车、私人导游、程序员研发、中文私教、商务翻译与验厂验货</strong>。平台人员均为严选兼职，业务对接以人才类别为主。与客服深入洽谈时间与细节后，客服将为您统筹排期并整好定制订单，支持 USDT/USDC 加密安全托管支付。
        </p>

        <!-- Category Quick Badges -->
        <div class="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto mb-10">
          <span
            v-for="cat in TALENT_CATEGORIES.slice(0, 5)"
            :key="cat.id"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer hover:border-brand-500 transition-colors"
            @click="openInquiryForCategory(cat.id)"
          >
            <component :is="getCategoryIcon(cat.id)" class="w-3.5 h-3.5 text-brand-500" />
            <span>{{ cat.name }}</span>
          </span>
        </div>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <router-link
            to="/talents"
            class="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-glow-brand hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Users class="w-5 h-5" />
            <span>{{ t('hero.cta') }}</span>
            <ArrowRight class="w-5 h-5" />
          </router-link>

          <router-link
            to="/chat"
            class="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-base bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare class="w-5 h-5 text-brand-500" />
            <span>直接与客服沟通用人需求</span>
          </router-link>
        </div>

        <!-- Metric Counters -->
        <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-10 border-t border-slate-200/80 dark:border-slate-800/80">
          <div>
            <div class="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">按类别派单</div>
            <div class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">司机 / 导游 / 程序员 / 中文老师</div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">全员兼职</div>
            <div class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">严选签约兼职人才池</div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">客服统筹</div>
            <div class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">沟通需求并整好订单</div>
          </div>
          <div>
            <div class="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">USDT / USDC</div>
            <div class="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">Pay3 HD 链上安全托管</div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION: Core Service Categories Showcase -->
    <section class="py-16 bg-slate-50/60 dark:bg-slate-900/30 border-y border-slate-200/80 dark:border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
              <Sparkles class="w-4 h-4" />
              <span>Talent Categories</span>
            </div>
            <h2 class="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white">
              精选中国兼职人才服务类别
            </h2>
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              客户对接均以类别为主，告知客服您的时间地点与具体需求，由客服统筹兼职排期整好订单。
            </p>
          </div>

          <router-link
            to="/talents"
            class="inline-flex items-center gap-2 font-bold text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700"
          >
            <span>查看完整类别与展示墙</span>
            <ArrowRight class="w-4 h-4" />
          </router-link>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="cat in TALENT_CATEGORIES.slice(0, 4)"
            :key="cat.id"
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-brand-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                  <component :is="getCategoryIcon(cat.id)" class="w-6 h-6" />
                </div>
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  {{ cat.badge }}
                </span>
              </div>

              <h3 class="text-base font-bold text-slate-900 dark:text-white mb-1">
                {{ cat.name }}
              </h3>
              <p class="text-xs text-brand-600 dark:text-brand-400 font-medium mb-2.5">
                {{ cat.nameEn }}
              </p>
              <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                {{ cat.description }}
              </p>

              <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                参考：{{ cat.priceGuide }}
              </div>
            </div>

            <button
              type="button"
              class="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-brand-500/10 hover:bg-brand-500 text-brand-600 hover:text-white dark:text-brand-400 dark:hover:text-white transition-all flex items-center justify-center gap-1.5"
              @click="openInquiryForCategory(cat.id)"
            >
              <MessageSquare class="w-3.5 h-3.5" />
              <span>与客服沟通此类别需求</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works (End-to-End Journey) -->
    <section class="py-16 bg-white dark:bg-slate-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <h2 class="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 dark:text-white mb-3">
            GoChina 兼职人才与按单定制服务流程
          </h2>
          <p class="text-sm text-slate-600 dark:text-slate-400">
            全员签约严选兼职，以类别对接沟通，客服统筹排期并整好订单，链上托管安全支付。
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- Step 1 -->
          <div class="relative bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-lg mb-4">
              01
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">选择人才类别</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              浏览司机带车、私人导游、程序员开发、中文私教或商务翻译等类别，按需发起咨询。
            </p>
          </div>

          <!-- Step 2 -->
          <div class="relative bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-lg mb-4">
              02
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">与客服 1v1 沟通细节</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              在站内专属 1v1 聊天系统中直接与客服对接具体城市、用车要求、技术栈或教学目标与时间。
            </p>
          </div>

          <!-- Step 3 -->
          <div class="relative bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg mb-4">
              03
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">客服统筹整好订单</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              全员为签约严选兼职。客服统筹排期后，在平台为您整好专属定制订单/合同。
            </p>
          </div>

          <!-- Step 4 -->
          <div class="relative bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
              04
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">加密支付与履约</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              一键使用 Pay3 链上独立地址支付 USDT/USDC，兼职专家按约定履约，交付成果。
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Talents Showcase (签约兼职专家展示墙) -->
    <section class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <div class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
            <Building2 class="w-4 h-4" />
            <span>签约兼职专家展示墙 • 案例参考</span>
          </div>
          <h2 class="text-3xl font-display font-extrabold text-slate-900 dark:text-white">
            兼职人才库代表展示 (Exhibition Only)
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            展示部分兼职人才资历与技能范围。实际订单均按人才类别由客服统筹排期派单。
          </p>
        </div>

        <router-link
          to="/talents"
          class="inline-flex items-center gap-2 font-bold text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700"
        >
          <span>查看全部兼职展示墙</span>
          <ArrowRight class="w-4 h-4" />
        </router-link>
      </div>

      <!-- Banner -->
      <div class="p-3.5 mb-8 bg-brand-50 dark:bg-brand-950/20 border border-brand-500/20 rounded-2xl flex items-center gap-3 text-xs text-brand-800 dark:text-brand-300">
        <Info class="w-4 h-4 text-brand-500 shrink-0" />
        <span>展示墙展示人员代表实力背景。所有用人均由客服根据您的时间、地点统筹排期，整好订单后派发。</span>
      </div>

      <!-- Talents Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="talent in featuredTalents"
          :key="talent.id"
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-brand-500/40 transition-all flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center space-x-3 mb-4">
              <img
                :src="talent.avatar"
                :alt="talent.name"
                class="w-14 h-14 rounded-2xl object-cover border border-brand-500/20"
              />
              <div class="min-w-0">
                <div class="flex items-center gap-1">
                  <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {{ talent.name }}
                  </h3>
                  <span class="text-brand-500 text-xs">✓</span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {{ talent.title }}
                </p>
                <div class="flex items-center gap-1 text-[11px] text-amber-500 mt-0.5">
                  <Star class="w-3 h-3 fill-amber-500" />
                  <span class="font-bold">{{ talent.rating }}</span>
                  <span class="text-slate-400">({{ talent.completedContracts }} 评价)</span>
                </div>
              </div>
            </div>

            <div class="text-xs text-slate-500 flex items-center gap-1 mb-3">
              <MapPin class="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span class="truncate">{{ talent.location }}</span>
            </div>

            <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
              {{ talent.bio }}
            </p>
          </div>

          <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs text-slate-400">参考计费:</span>
              <span class="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">{{ talent.hourlyRate }}</span>
            </div>
            <button
              type="button"
              class="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-brand-500/10 hover:bg-brand-500 text-brand-600 hover:text-white dark:text-brand-400 dark:hover:text-white transition-all flex items-center justify-center gap-1.5"
              @click="openInquiryForTalent(talent)"
            >
              <MessageSquare class="w-3.5 h-3.5" />
              <span>按此类兼职咨询客服</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Inquiry Modal -->
    <InquiryModal
      :is-open="isModalOpen"
      :talent="selectedTalent"
      :initial-category="selectedCategoryForInquiry"
      @close="isModalOpen = false"
      @success="handleInquirySuccess"
      @open-auth="$emit('open-auth')"
    />
  </div>
</template>
