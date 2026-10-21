<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api, type TalentItem } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import InquiryModal from '@/components/inquiry/InquiryModal.vue';
import { TALENT_CATEGORIES, type TalentCategoryMeta } from '@/types/categories';
import {
  Search,
  MapPin,
  Star,
  CheckCircle2,
  Briefcase,
  Languages,
  MessageSquare,
  ShieldCheck,
  FileCheck2,
  Clock,
  ExternalLink,
  Users,
  Car,
  Compass,
  Code,
  BookOpen,
  Building,
  Check,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-vue-next';

const authStore = useAuthStore();

const talents = ref<TalentItem[]>([]);
const isLoading = ref(true);
const activeCategory = ref('all');
const searchQuery = ref('');

// Modal state
const isModalOpen = ref(false);
const selectedTalent = ref<TalentItem | null>(null);
const selectedCategoryForInquiry = ref<string>('driver');

const filterCategories = [
  { id: 'all', name: '全部人才 (All)' },
  { id: 'driver', name: '🚗 司机带车' },
  { id: 'guide', name: '🧭 私人导游' },
  { id: 'tech', name: '💻 程序员' },
  { id: 'chinese_tutor', name: '📖 中文老师' },
  { id: 'translation', name: '🌐 商务翻译' },
  { id: 'inspection', name: '🔍 验厂验货' },
  { id: 'concierge', name: '🏢 本地代办' },
];

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

function getCategoryName(catId: string): string {
  const meta = TALENT_CATEGORIES.find((c) => c.id === catId);
  return meta ? meta.name : catId;
}

async function loadTalents() {
  isLoading.value = true;
  try {
    talents.value = await api.getTalents(
      activeCategory.value === 'all' ? undefined : activeCategory.value,
      searchQuery.value || undefined
    );
  } catch (err) {
    console.error('Failed to load talents', err);
  } finally {
    isLoading.value = false;
  }
}

function handleCategoryChange(cat: string) {
  activeCategory.value = cat;
  loadTalents();
}

function handleSearch() {
  loadTalents();
}

function openInquiryForCategory(catId: string) {
  selectedTalent.value = null;
  selectedCategoryForInquiry.value = catId;
  isModalOpen.value = true;
}

function openInquiryForTalent(talent: TalentItem) {
  selectedTalent.value = talent;
  selectedCategoryForInquiry.value = talent.category;
  isModalOpen.value = true;
}

function handleInquirySuccess(inquiryId: string) {
  // Can redirect or show notification
}

onMounted(() => {
  loadTalents();
});
</script>

<template>
  <div class="min-h-screen py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Top Hero Section -->
    <div class="text-center max-w-4xl mx-auto mb-14">
      <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-4">
        <Users class="w-3.5 h-3.5" />
        <span>中国严选兼职人才库 • 按类别派单对接 • 客服统筹整好订单</span>
      </div>
      <h1 class="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white mb-5 leading-tight">
        按人才类别对接，由客服量身定制订单
      </h1>
      <p class="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
        涵盖<strong>司机带车、导游地陪、程序员研发、中文私教、商务翻译、验厂验货及本地代办</strong>。目前服务人员均为严选兼职，业务对接以<strong>人才类别</strong>为主。与客服深入沟通需求细节后，由平台统筹排期并<strong>为您整好定制订单</strong>，支持 USDT/USDC 加密安全托管。
      </p>

      <!-- Trust Badges -->
      <div class="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span class="flex items-center gap-1.5"><Car class="w-4 h-4 text-brand-500" /> 专车司机 • 兼职导游 • 程序员 • 中文私教</span>
        <span class="flex items-center gap-1.5"><CheckCircle2 class="w-4 h-4 text-emerald-500" /> 100% 严选签约兼职人才池</span>
        <span class="flex items-center gap-1.5"><FileCheck2 class="w-4 h-4 text-cyan-500" /> 客服统筹排期并整好订单</span>
        <span class="flex items-center gap-1.5"><ShieldCheck class="w-4 h-4 text-amber-500" /> Pay3 链上智能托管支付</span>
      </div>
    </div>

    <!-- SECTION 1: Talent Categories Matrix (核心类别矩阵) -->
    <section class="mb-20">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Core Service Categories</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
            1. 人才服务类别矩阵 (按类别洽谈派单)
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            选择您需要的人才类别，直接与客服洽谈具体时间、地点与服务要求。
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="cat in TALENT_CATEGORIES"
          :key="cat.id"
          class="group bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-brand-500/50 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <component :is="getCategoryIcon(cat.id)" class="w-6 h-6" />
              </div>
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                {{ cat.badge }}
              </span>
            </div>

            <div class="mb-2">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{{ cat.name }}</span>
              </h3>
              <p class="text-xs text-brand-600 dark:text-brand-400 font-medium">
                {{ cat.nameEn }}
              </p>
            </div>

            <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg inline-block">
              {{ cat.tagline }}
            </div>

            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {{ cat.description }}
            </p>

            <!-- Features -->
            <ul class="space-y-1.5 mb-5 text-[11px] text-slate-600 dark:text-slate-300">
              <li v-for="feat in cat.features.slice(0, 3)" :key="feat" class="flex items-start gap-1.5">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{{ feat }}</span>
              </li>
            </ul>
          </div>

          <!-- Bottom Card Action -->
          <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">参考计费标准</span>
              <span class="text-xs font-mono font-extrabold text-brand-600 dark:text-brand-400">{{ cat.priceGuide }}</span>
            </div>
            <button
              type="button"
              class="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-brand-500 hover:bg-brand-600 text-white shadow-glow-brand transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
              @click="openInquiryForCategory(cat.id)"
            >
              <MessageSquare class="w-3.5 h-3.5" />
              <span>与客服对接此服务类别</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: Sample Part-time Talent Wall (签约兼职人才案例展示墙) -->
    <section>
      <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mb-1">
            <Users class="w-3.5 h-3.5" />
            <span>Showcase & Portfolio Only</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 dark:text-white">
            2. 签约兼职专家展示墙 (案例代表展示)
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            展示平台部分代表性兼职人才资历与技能。个人墙不设直接排期购买，统一按人才类别由客服统筹排期派单。
          </p>
        </div>

        <button
          type="button"
          class="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white shadow-glow-brand transition-all flex items-center justify-center gap-2"
          @click="openInquiryForCategory('driver')"
        >
          <MessageSquare class="w-4 h-4" />
          <span>直接向客服提出兼职用人需求</span>
        </button>
      </div>

      <!-- Explanatory Banner -->
      <div class="p-4 mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
        <Info class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div class="leading-relaxed">
          <strong>展示墙说明：</strong>个人墙仅供展示兼职人员的真实资历、语言能力与历史好评。目前我们所有人员均为<strong>严选兼职</strong>。对接时均以<strong>人才类别</strong>（如司机带车、私人导游、程序员、中文老师等）为基准，具体时间、地点与服务要求由<strong>客服与您沟通</strong>，确认无误后由客服<strong>为您整好并生成定制订单</strong>。
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="mb-8 space-y-4">
        <div class="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <!-- Search Input -->
          <div class="relative w-full sm:max-w-md">
            <Search class="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="按城市（如深圳、北京）、技能或名字搜索兼职专家..."
              class="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-brand-500 outline-none"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>

        <!-- Category Filter Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            v-for="cat in filterCategories"
            :key="cat.id"
            type="button"
            class="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all"
            :class="activeCategory === cat.id ? 'bg-brand-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
            @click="handleCategoryChange(cat.id)"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Talents Grid -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="i in 6"
          :key="i"
          class="h-72 rounded-3xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200/50 dark:border-slate-800"
        ></div>
      </div>

      <div
        v-else-if="talents.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="talent in talents"
          :key="talent.id"
          class="group relative bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-brand-500/50 transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <!-- Header with Avatar and Status -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3.5">
                <div class="relative">
                  <img
                    :src="talent.avatar"
                    :alt="talent.name"
                    class="w-14 h-14 rounded-2xl object-cover border-2 border-brand-500/20 group-hover:border-brand-500 transition-colors"
                  />
                  <span
                    class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500"
                    title="签约兼职专家库储备"
                  ></span>
                </div>
                <div>
                  <div class="flex items-center gap-1.5">
                    <h3 class="text-base font-bold text-slate-900 dark:text-white">
                      {{ talent.name }}
                    </h3>
                    <span class="text-brand-500 text-xs" title="已实名背景核验">✓</span>
                  </div>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      {{ getCategoryName(talent.category) }}
                    </span>
                    <span class="text-[10px] text-slate-400">签约兼职展示</span>
                  </div>
                </div>
              </div>

              <!-- Rate Pill -->
              <div class="text-right">
                <span class="text-sm font-extrabold text-brand-600 dark:text-brand-400 font-mono block">
                  {{ talent.hourlyRate }}
                </span>
                <span v-if="talent.dailyRate" class="text-[10px] text-slate-400 block font-mono">
                  {{ talent.dailyRate }}
                </span>
              </div>
            </div>

            <p class="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
              {{ talent.title }}
            </p>

            <!-- Location & Rating -->
            <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span class="flex items-center gap-1 truncate max-w-[180px]">
                <MapPin class="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span class="truncate">{{ talent.location }}</span>
              </span>
              <div class="flex items-center gap-2">
                <span class="flex items-center gap-0.5 text-amber-500 font-semibold">
                  <Star class="w-3.5 h-3.5 fill-amber-500" />
                  <span>{{ talent.rating }}</span>
                </span>
                <span class="text-slate-300 dark:text-slate-600">|</span>
                <span class="text-slate-500">{{ talent.completedContracts }} 评价</span>
              </div>
            </div>

            <!-- Bio -->
            <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
              {{ talent.bio }}
            </p>

            <!-- Skills Badges -->
            <div class="flex flex-wrap gap-1.5 mb-4">
              <span
                v-for="skill in talent.skills.slice(0, 4)"
                :key="skill"
                class="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                {{ skill }}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              type="button"
              class="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs bg-brand-500/10 hover:bg-brand-500 text-brand-600 hover:text-white dark:text-brand-400 dark:hover:text-white transition-all flex items-center justify-center gap-1.5"
              @click="openInquiryForTalent(talent)"
            >
              <MessageSquare class="w-3.5 h-3.5" />
              <span>按此类兼职咨询客服</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <Briefcase class="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-1">未找到匹配的兼职展示专家</h3>
        <p class="text-xs text-slate-500 max-w-sm mx-auto mb-4">
          我们庞大的兼职人才网络可覆盖全中国各主要城市。请直接告诉客服您的服务需求。
        </p>
        <button
          type="button"
          class="px-5 py-2.5 rounded-xl font-semibold text-xs bg-brand-500 text-white shadow-glow-brand"
          @click="openInquiryForCategory('driver')"
        >
          联系客服定制此类兼职需求
        </button>
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
