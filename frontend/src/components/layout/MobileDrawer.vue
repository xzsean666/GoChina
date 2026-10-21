<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';
import { useI18n } from '@/composables/useI18n';
import {
  Globe2,
  X,
  Sun,
  Moon,
  User,
  Shield,
  LogOut,
  Sparkles,
} from 'lucide-vue-next';

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open-auth'): void;
}>();

const authStore = useAuthStore();
const { isDark, toggleTheme } = useTheme();
const { locale, setLocale, t } = useI18n();

function handleClose() {
  emit('close');
}

function handleAuthOpen() {
  emit('close');
  emit('open-auth');
}

function handleLogout() {
  authStore.clearSession();
  emit('close');
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 md:hidden">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300"
      @click="handleClose"
    />

    <!-- Drawer Panel -->
    <div
      class="fixed inset-y-0 right-0 max-w-xs w-full bg-white/95 dark:bg-dark-card/95 backdrop-blur-2xl border-l border-slate-200 dark:border-white/10 shadow-2xl p-6 flex flex-col justify-between z-10 transition-transform transform duration-300"
    >
      <div>
        <!-- Header -->
        <div class="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-cyan-400 flex items-center justify-center p-0.5 shadow-glow-brand">
              <div class="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Globe2 class="w-4 h-4 text-brand-400" />
              </div>
            </div>
            <div class="flex flex-col">
              <span class="font-display font-bold text-lg bg-gradient-to-r from-slate-900 to-brand-600 dark:from-white dark:to-cyan-400 bg-clip-text text-transparent">
                GoChina
              </span>
              <span class="text-[9px] font-mono uppercase tracking-widest text-slate-400">Edge Portal</span>
            </div>
          </div>
          <button
            type="button"
            class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            @click="handleClose"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Navigation Links -->
        <div class="py-6 space-y-2">
          <router-link
            to="/talents"
            class="flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
            @click="handleClose"
          >
            <User class="w-4 h-4 mr-2" />
            {{ t('nav.talents') }}
          </router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            to="/contracts"
            class="flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
            @click="handleClose"
          >
            <Shield class="w-4 h-4 mr-2" />
            {{ t('nav.contracts') }}
          </router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            to="/inquiries"
            class="flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-colors"
            @click="handleClose"
          >
            <Activity class="w-4 h-4 mr-2" />
            {{ t('nav.inquiries') }}
          </router-link>
          <a
            href="/#plans"
            class="block px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            @click="handleClose"
          >
            {{ t('nav.plans') }}
          </a>
          <router-link
            v-if="authStore.isAuthenticated"
            to="/dashboard"
            class="flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
            @click="handleClose"
          >
            <User class="w-4 h-4 mr-2" />
            {{ t('nav.dashboard') }}
          </router-link>
          <router-link
            v-if="authStore.isAdmin"
            to="/admin"
            class="flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            @click="handleClose"
          >
            <Shield class="w-4 h-4 mr-2" />
            {{ t('nav.admin') }}
          </router-link>
        </div>

        <!-- Controls: Language & Theme -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div>
            <span class="text-xs text-slate-400 block mb-2 font-medium">Language</span>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                class="py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all"
                :class="locale === 'zh' ? 'bg-brand-500 text-white border-brand-500 shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'"
                @click="setLocale('zh')"
              >
                中文
              </button>
              <button
                type="button"
                class="py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all"
                :class="locale === 'en' ? 'bg-brand-500 text-white border-brand-500 shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'"
                @click="setLocale('en')"
              >
                EN
              </button>
              <button
                type="button"
                class="py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all"
                :class="locale === 'ja' ? 'bg-brand-500 text-white border-brand-500 shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'"
                @click="setLocale('ja')"
              >
                日本語
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between py-2">
            <span class="text-xs text-slate-400 font-medium">{{ t('nav.theme') }}</span>
            <button
              type="button"
              class="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs"
              @click="toggleTheme"
            >
              <Sun v-if="isDark" class="w-4 h-4 text-amber-400" />
              <Moon v-else class="w-4 h-4 text-slate-600" />
              <span>{{ isDark ? 'Dark' : 'Light' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer / Auth CTA -->
      <div class="pt-6 border-t border-slate-100 dark:border-slate-800">
        <div v-if="authStore.isAuthenticated" class="space-y-3">
          <div class="flex items-center space-x-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
            <div class="w-6 h-6 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs">
              {{ (authStore.user?.email || authStore.user?.address || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="truncate text-xs font-mono text-slate-700 dark:text-slate-300 flex-1">
              {{ authStore.user?.email || authStore.user?.address }}
            </div>
          </div>
          <button
            type="button"
            class="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            @click="handleLogout"
          >
            <LogOut class="w-4 h-4 mr-2" />
            {{ t('nav.logout') }}
          </button>
        </div>
        <button
          v-else
          type="button"
          class="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-cyan-600 shadow-md shadow-brand-500/25"
          @click="handleAuthOpen"
        >
          <Sparkles class="w-4 h-4 mr-2" />
          {{ t('nav.login') }}
        </button>
      </div>
    </div>
  </div>
</template>
