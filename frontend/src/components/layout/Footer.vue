<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';
import { Globe2, ShieldCheck, Zap, Cpu } from 'lucide-vue-next';

const { t } = useI18n();
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer
    class="border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-100/60 dark:bg-dark-surface/60 backdrop-blur-xl transition-colors duration-200 relative z-10"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-10">
        <!-- Brand Info -->
        <div class="md:col-span-2 space-y-4">
          <div class="flex items-center space-x-3">
            <div
              class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-cyan-400 p-[1.5px] shadow-glow-brand"
            >
              <div
                class="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center"
              >
                <Globe2 class="w-4 h-4 text-brand-400" />
              </div>
            </div>
            <span
              class="font-display font-extrabold text-xl bg-gradient-to-r from-slate-900 via-brand-600 to-cyan-600 dark:from-white dark:via-brand-300 dark:to-cyan-400 bg-clip-text text-transparent"
            >
              GoChina
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            {{ t('footer.desc') }}
          </p>

          <!-- Badges -->
          <div class="flex flex-wrap gap-2 pt-2">
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20"
            >
              <Zap class="w-3 h-3 mr-1 text-orange-500" />
              Cloudflare Workers (Edge V8)
            </span>
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
            >
              <Cpu class="w-3 h-3 mr-1 text-cyan-500" />
              KVDB MultiKey B-Tree
            </span>
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            >
              <ShieldCheck class="w-3 h-3 mr-1 text-emerald-500" />
              Pay3 Non-Custodial HD
            </span>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="space-y-3">
          <h4 class="text-xs font-mono font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
            Navigation
          </h4>
          <ul class="space-y-2 text-xs">
            <li>
              <a href="#plans" class="text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors">
                {{ t('nav.plans') }}
              </a>
            </li>
            <li>
              <a href="#features" class="text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors">
                {{ t('nav.features') }}
              </a>
            </li>
            <li>
              <router-link to="/dashboard" class="text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors">
                {{ t('nav.dashboard') }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Legal & Operations -->
        <div class="space-y-3">
          <h4 class="text-xs font-mono font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
            Infrastructure
          </h4>
          <ul class="space-y-2 text-xs">
            <li class="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
              <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>Global SLA 99.99% Edge Delivery</span>
            </li>
            <li>
              <span class="text-slate-500 dark:text-slate-400">
                Non-Custodial Child Derivation
              </span>
            </li>
            <li>
              <span class="text-slate-500 dark:text-slate-400">
                Deterministic Keyset Cursor
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mt-10 pt-8 border-t border-slate-200/60 dark:border-white/[0.05] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500"
      >
        <p>© {{ currentYear }} {{ t('footer.rights') }}</p>
        <p class="mt-2 sm:mt-0 font-mono text-[11px] text-slate-400 dark:text-slate-500">
          v0.1.0 • workerd edge-native
        </p>
      </div>
    </div>
  </footer>
</template>
