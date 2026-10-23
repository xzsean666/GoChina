<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';
import { useI18n, type Locale } from '@/composables/useI18n';
import {
  Globe2,
  Sun,
  Moon,
  Menu,
  Languages,
  User,
  LogOut,
  Shield,
  ChevronDown,
  Activity,
  Droplets,
} from 'lucide-vue-next';

defineProps<{
  onOpenAuth?: () => void;
  onToggleMobile?: () => void;
}>();

const emit = defineEmits<{
  (e: 'open-auth'): void;
  (e: 'toggle-mobile'): void;
}>();

const authStore = useAuthStore();
const { isDark, toggleTheme } = useTheme();
const { locale, setLocale, t } = useI18n();

const showLangDropdown = ref(false);
const showUserDropdown = ref(false);

function changeLang(lang: Locale) {
  setLocale(lang);
  showLangDropdown.value = false;
}

function handleAuthClick() {
  emit('open-auth');
}

function handleMobileClick() {
  emit('toggle-mobile');
}

function truncateIdentifier(id?: string): string {
  if (!id) return 'User';
  if (id.startsWith('0x') && id.length > 10) {
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  }
  if (id.includes('@')) {
    const [user, domain] = id.split('@');
    return user.length > 8 ? `${user.slice(0, 5)}...@${domain}` : id;
  }
  return id.length > 12 ? `${id.slice(0, 10)}...` : id;
}
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full glass-nav transition-colors duration-200"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 sm:h-20">
        <!-- Brand Logo & Live Edge Status -->
        <div class="flex items-center space-x-4">
          <a href="/" class="flex items-center space-x-3 group">
            <div
              class="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 via-brand-400 to-cyan-400 p-[1.5px] shadow-glow-brand group-hover:scale-105 transition-transform duration-300"
            >
              <div
                class="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center"
              >
                <Globe2 class="w-5 h-5 text-brand-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div class="flex flex-col">
              <span
                class="text-xl sm:text-2xl font-display font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-brand-600 to-cyan-600 dark:from-white dark:via-brand-300 dark:to-cyan-400 bg-clip-text text-transparent"
              >
                GoChina
              </span>
              <span class="text-[9px] font-mono tracking-widest uppercase text-slate-500 dark:text-slate-400 -mt-0.5">
                Edge Serverless Portal
              </span>
            </div>
          </a>

          <!-- Live Network Telemetry Pill (Desktop) -->
          <div class="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span>Anycast 300+ PoPs</span>
          </div>
        </div>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-1 text-sm font-medium">
          <router-link
            to="/faucet"
            class="px-3 py-1.5 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-all duration-150 flex items-center gap-1.5 font-semibold text-xs border border-amber-500/30 mr-1"
          >
            <Droplets class="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{{ t('nav.faucet') }}</span>
          </router-link>
          <router-link
            to="/talents"
            class="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all duration-150 flex items-center gap-1.5 font-semibold text-brand-600 dark:text-brand-400"
          >
            <User class="w-4 h-4 text-brand-500" />
            <span>{{ t('nav.talents') }}</span>
          </router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            to="/contracts"
            class="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all duration-150 flex items-center gap-1.5"
          >
            <Shield class="w-4 h-4 text-emerald-500" />
            <span>{{ t('nav.contracts') }}</span>
          </router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            to="/inquiries"
            class="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all duration-150 flex items-center gap-1.5"
          >
            <Activity class="w-4 h-4 text-cyan-500" />
            <span>{{ t('nav.inquiries') }}</span>
          </router-link>
          <a
            href="/#plans"
            class="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all duration-150"
          >
            {{ t('nav.plans') }}
          </a>
          <router-link
            v-if="authStore.isAuthenticated"
            to="/dashboard"
            class="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all duration-150 flex items-center gap-1.5"
          >
            <User class="w-4 h-4 text-brand-500" />
            <span>{{ t('nav.dashboard') }}</span>
          </router-link>
          <router-link
            v-if="authStore.isAdmin"
            to="/admin"
            class="px-3.5 py-2 rounded-xl text-amber-600 dark:text-amber-400 hover:text-amber-500 hover:bg-amber-500/10 transition-all duration-150 flex items-center gap-1.5 font-semibold"
          >
            <Shield class="w-4 h-4 text-amber-500" />
            <span>{{ t('nav.admin') }}</span>
          </router-link>
        </nav>

        <!-- Right Side Controls -->
        <div class="flex items-center space-x-2 sm:space-x-3">
          <!-- Language Selector -->
          <div class="relative">
            <button
              type="button"
              class="p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition-all flex items-center gap-1.5"
              title="Change Language"
              @click="showLangDropdown = !showLangDropdown"
            >
              <Languages class="w-4 h-4" />
              <span class="text-xs uppercase font-mono font-medium hidden sm:inline">{{ locale }}</span>
              <ChevronDown class="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>
            <div
              v-if="showLangDropdown"
              class="absolute right-0 mt-2 w-36 glass-panel rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <button
                type="button"
                class="w-full text-left px-3.5 py-2 text-xs hover:bg-brand-500/10 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                :class="locale === 'zh' ? 'text-brand-500 font-bold' : 'text-slate-700 dark:text-slate-200'"
                @click="changeLang('zh')"
              >
                <span>简体中文</span>
                <span v-if="locale === 'zh'" class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              </button>
              <button
                type="button"
                class="w-full text-left px-3.5 py-2 text-xs hover:bg-brand-500/10 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                :class="locale === 'en' ? 'text-brand-500 font-bold' : 'text-slate-700 dark:text-slate-200'"
                @click="changeLang('en')"
              >
                <span>English</span>
                <span v-if="locale === 'en'" class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              </button>
              <button
                type="button"
                class="w-full text-left px-3.5 py-2 text-xs hover:bg-brand-500/10 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                :class="locale === 'ja' ? 'text-brand-500 font-bold' : 'text-slate-700 dark:text-slate-200'"
                @click="changeLang('ja')"
              >
                <span>日本語</span>
                <span v-if="locale === 'ja'" class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              </button>
            </div>
          </div>

          <!-- Theme Toggle -->
          <button
            type="button"
            class="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition-all"
            :title="t('nav.theme')"
            @click="toggleTheme"
          >
            <Sun v-if="isDark" class="w-4 h-4 text-amber-400 hover:rotate-90 transition-transform duration-300" />
            <Moon v-else class="w-4 h-4 text-slate-600 hover:-rotate-12 transition-transform duration-300" />
          </button>

          <!-- Authenticated User Dropdown or Sign In CTA -->
          <div v-if="authStore.isAuthenticated" class="relative hidden sm:block">
            <button
              type="button"
              class="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 hover:border-brand-500/40 transition-all text-xs font-medium shadow-sm"
              @click="showUserDropdown = !showUserDropdown"
            >
              <span class="relative flex h-2 w-2">
                <span class="inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span class="text-slate-800 dark:text-slate-200 font-mono">
                {{ truncateIdentifier(authStore.user?.email || authStore.user?.address) }}
              </span>
              <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
            </button>

            <!-- User Menu Dropdown -->
            <div
              v-if="showUserDropdown"
              class="absolute right-0 mt-2 w-52 glass-panel rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div class="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                Connected as <span class="font-bold text-slate-700 dark:text-slate-200 uppercase">{{ authStore.user?.role }}</span>
              </div>
              <router-link
                to="/dashboard"
                class="flex items-center px-3.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                @click="showUserDropdown = false"
              >
                <User class="w-3.5 h-3.5 mr-2 text-brand-500" />
                {{ t('nav.dashboard') }}
              </router-link>
              <router-link
                v-if="authStore.isAdmin"
                to="/admin"
                class="flex items-center px-3.5 py-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                @click="showUserDropdown = false"
              >
                <Shield class="w-3.5 h-3.5 mr-2 text-amber-500" />
                {{ t('nav.admin') }}
              </router-link>
              <button
                type="button"
                class="w-full flex items-center px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border-t border-slate-100 dark:border-slate-800 mt-1"
                @click="authStore.clearSession(); showUserDropdown = false"
              >
                <LogOut class="w-3.5 h-3.5 mr-2" />
                {{ t('nav.logout') }}
              </button>
            </div>
          </div>

          <!-- Sign In Button -->
          <button
            v-else
            type="button"
            class="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 shadow-md shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            @click="handleAuthClick"
          >
            {{ t('nav.login') }}
          </button>

          <!-- Mobile Hamburger Toggle -->
          <button
            type="button"
            class="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            @click="handleMobileClick"
          >
            <Menu class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
