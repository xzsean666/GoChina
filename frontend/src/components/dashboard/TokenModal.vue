<script setup lang="ts">
import { ref, watch } from 'vue';
import QRCode from 'qrcode';
import { useToast } from '@/composables/useToast';
import { X, Copy, Check, Eye, EyeOff, KeyRound, ShieldAlert, Scan } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  token: string;
  planName?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { toast } = useToast();
const qrDataUrl = ref<string>('');
const isMasked = ref(true);
const isCopied = ref(false);

watch(
  () => [props.isOpen, props.token],
  async ([open, val]) => {
    if (open && val) {
      try {
        const qr = await QRCode.toDataURL(val as string, {
          width: 260,
          margin: 1,
          color: {
            dark: '#080b11',
            light: '#ffffff',
          },
        });
        qrDataUrl.value = qr;
      } catch (err) {
        qrDataUrl.value = '';
      }
    }
  },
  { immediate: true }
);

async function handleCopy() {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(props.token);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = props.token;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    isCopied.value = true;
    toast.success('Token Copied', 'Credential copied to clipboard.');
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    toast.warning('Clipboard Access', 'Please copy token manually.');
  }
}

function handleClose() {
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

    <!-- Dialog -->
    <div
      class="relative w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-white/[0.08] rounded-3xl shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200"
    >
      <button
        type="button"
        class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        @click="handleClose"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Header -->
      <div class="mb-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center border border-brand-500/20 shadow-glow-brand">
            <KeyRound class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-lg font-display font-bold text-slate-900 dark:text-white">
              Entitlement Access Credential
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ planName || 'Active Service Plan' }}
            </p>
          </div>
        </div>
      </div>

      <!-- High-Tech QR Code Section -->
      <div class="py-3 text-center">
        <div class="relative inline-block p-3 bg-white rounded-2xl shadow-md border border-slate-200 mb-3 group">
          <!-- Corner reticles -->
          <div class="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-brand-500 rounded-tl-sm pointer-events-none"></div>
          <div class="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-brand-500 rounded-tr-sm pointer-events-none"></div>
          <div class="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-brand-500 rounded-bl-sm pointer-events-none"></div>
          <div class="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-brand-500 rounded-br-sm pointer-events-none"></div>

          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="Access Token QR"
            class="w-44 h-44 rounded-xl mx-auto"
          />
        </div>
        <p class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          Compatible with GoChina Client, Clash, Sing-box & V2Ray.
        </p>
      </div>

      <!-- Token String Box -->
      <div class="space-y-2 mt-2">
        <div class="flex items-center justify-between text-xs text-slate-500">
          <span class="font-mono text-[11px] font-semibold uppercase tracking-wider">Bearer Access Token</span>
          <button
            type="button"
            class="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-medium hover:underline text-xs"
            @click="isMasked = !isMasked"
          >
            <component :is="isMasked ? Eye : EyeOff" class="w-3.5 h-3.5" />
            <span>{{ isMasked ? 'Reveal' : 'Mask' }}</span>
          </button>
        </div>

        <div class="flex items-center gap-2 p-3 bg-slate-50 dark:bg-dark-surface rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
          <span class="flex-1 font-mono text-xs text-slate-800 dark:text-slate-200 truncate select-all">
            {{ isMasked ? `${token.slice(0, 8)}••••••••••••••••••••••••••••${token.slice(-6)}` : token }}
          </span>
          <button
            type="button"
            class="p-1.5 rounded-lg text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Copy token"
            @click="handleCopy"
          >
            <Check v-if="isCopied" class="w-4 h-4 text-brand-500" />
            <Copy v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="mt-4 flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
        <ShieldAlert class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
        <p class="leading-relaxed">
          Do not share this token publicly. Anyone with this credential can consume your allotted edge bandwidth quota.
        </p>
      </div>
    </div>
  </div>
</template>
