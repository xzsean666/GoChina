<script setup lang="ts">
import { ref, computed } from 'vue';
import { api } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import {
  X,
  Wallet,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const authStore = useAuthStore();
const { toast } = useToast();

const isConnectingWallet = ref(false);
const errorMsg = ref('');
const selectedProvider = ref<'injected' | 'rabby' | 'metamask'>('injected');

const hasEthereum = computed(() => {
  return typeof window !== 'undefined' && !!(window as any).ethereum;
});

async function handleWeb3Login() {
  errorMsg.value = '';
  isConnectingWallet.value = true;

  try {
    const ethereum = typeof window !== 'undefined' ? (window as any).ethereum : null;
    if (!ethereum) {
      throw new Error('No Web3 wallet detected. Please install MetaMask or Rabby extension.');
    }

    // Request accounts access
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];
    if (!address) {
      throw new Error('No Ethereum account selected.');
    }

    // Prepare gasless timestamp message
    const timestamp = Date.now();
    const message = `Sign in to GoChina Portal at ${timestamp}`;

    // Request personal signature (gasless off-chain ECDSA signature)
    const signature = await ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    });

    // Exchange with Edge Backend API
    const res = await api.loginWeb3(address, signature, message);
    authStore.setSession(res.token, res.user);

    toast.success('Wallet Connected', `Signed in as ${address.slice(0, 6)}...${address.slice(-4)}`);
    emit('success');
    emit('close');
  } catch (err: any) {
    console.error('Web3 Auth Error:', err);
    errorMsg.value = err.message || 'Signature request was rejected.';
    toast.error('Authentication Failed', errorMsg.value);
  } finally {
    isConnectingWallet.value = false;
  }
}

function handleClose() {
  errorMsg.value = '';
  emit('close');
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
      @click="handleClose"
    />

    <!-- Dialog Card -->
    <div
      class="relative w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Close button -->
      <button
        type="button"
        class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20"
        @click="handleClose"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Glow Accent Banner -->
      <div class="h-1.5 w-full bg-gradient-to-r from-brand-500 via-cyan-400 to-emerald-400" />

      <!-- Header -->
      <div class="p-6 sm:p-8 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div class="flex items-center gap-2 mb-2">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Non-Custodial Web3 Auth
          </span>
        </div>
        <h2 class="text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight">
          Connect Web3 Wallet
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Sign a gasless cryptographic message with your EVM wallet to prove address ownership and register or sign in instantly.
        </p>
      </div>

      <!-- Body Content -->
      <div class="p-6 sm:p-8 space-y-5">
        <!-- Error Banner if any -->
        <div
          v-if="errorMsg"
          class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
          <span class="leading-relaxed">{{ errorMsg }}</span>
        </div>

        <!-- Primary Connect Card -->
        <div
          class="group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer"
          :class="[
            hasEthereum
              ? 'bg-gradient-to-b from-slate-50 to-white dark:from-dark-surface dark:to-dark-card border-slate-200 dark:border-white/10 hover:border-cyan-500/50 hover:shadow-glow-cyan'
              : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
          ]"
          @click="hasEthereum ? handleWeb3Login() : null"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform">
                <Wallet class="w-5 h-5 text-cyan-400" />
              </div>
              <div class="text-left">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-display font-bold text-slate-900 dark:text-white">
                    MetaMask / Rabby Wallet
                  </span>
                  <span
                    v-if="hasEthereum"
                    class="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  >
                    Detected
                  </span>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ hasEthereum ? 'EVM browser extension ready to sign' : 'Extension not found in this browser' }}
                </p>
              </div>
            </div>

            <div v-if="hasEthereum">
              <ArrowRight class="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>

        <!-- If no extension detected: show installation help -->
        <div
          v-if="!hasEthereum"
          class="p-4 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-300 space-y-2.5"
        >
          <p class="font-medium text-slate-900 dark:text-white text-xs">
            Need a Web3 Wallet?
          </p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            GoChina uses Ethereum personal signatures for secure, passwordless authentication. Install one of the leading extensions below:
          </p>
          <div class="flex gap-2 pt-1">
            <a
              href="https://rabby.io"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 text-center font-semibold text-[11px] text-cyan-600 dark:text-cyan-400 hover:border-cyan-500/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Rabby</span>
              <ExternalLink class="w-3 h-3 opacity-70" />
            </a>
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-white/10 text-center font-semibold text-[11px] text-brand-600 dark:text-brand-400 hover:border-brand-500/40 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>MetaMask</span>
              <ExternalLink class="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        <!-- Security & Architecture Trust Matrix -->
        <div class="grid grid-cols-3 gap-2 pt-1">
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-100 dark:border-white/[0.04] text-center">
            <Zap class="w-3.5 h-3.5 text-brand-500 mx-auto mb-1" />
            <span class="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 block">0 Gas Fee</span>
            <span class="text-[9px] text-slate-400 block mt-0.5">Off-Chain Sign</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-100 dark:border-white/[0.04] text-center">
            <Lock class="w-3.5 h-3.5 text-cyan-500 mx-auto mb-1" />
            <span class="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 block">Non-Custodial</span>
            <span class="text-[9px] text-slate-400 block mt-0.5">Key Stays Local</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-dark-surface border border-slate-100 dark:border-white/[0.04] text-center">
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-500 mx-auto mb-1" />
            <span class="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 block">Instant Auth</span>
            <span class="text-[9px] text-slate-400 block mt-0.5">Edge Verified</span>
          </div>
        </div>

        <!-- Main Action Button -->
        <button
          type="button"
          class="w-full py-3.5 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-cyan-500 to-brand-500 hover:from-cyan-500 hover:to-brand-400 shadow-glow-cyan transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
          :disabled="isConnectingWallet"
          @click="handleWeb3Login"
        >
          <Loader2 v-if="isConnectingWallet" class="w-4 h-4 animate-spin" />
          <Wallet v-else class="w-4 h-4" />
          <span>{{ isConnectingWallet ? 'Waiting for signature approval...' : 'Connect & Sign in with Web3' }}</span>
        </button>

        <p class="text-[10px] text-center text-slate-400 dark:text-slate-500 leading-normal">
          By signing, you authenticate using your public address. No transactions are sent and no funds are deducted.
        </p>
      </div>
    </div>
  </div>
</template>
