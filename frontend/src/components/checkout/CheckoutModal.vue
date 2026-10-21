<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';
import { api, type PlanDefinition, type OrderRecord } from '@/api/client';
import { useCountdown } from '@/composables/useCountdown';
import { useOrderPolling } from '@/composables/useOrderPolling';
import { useToast } from '@/composables/useToast';
import {
  X,
  Copy,
  Check,
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Scan,
  Radio,
} from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  plan: PlanDefinition | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', order: OrderRecord): void;
}>();

const router = useRouter();
const { toast } = useToast();

const isCreatingOrder = ref(false);
const isVerifying = ref(false);
const order = ref<OrderRecord | null>(null);
const qrDataUrl = ref<string>('');
const copiedField = ref<'address' | 'amount' | null>(null);
const isPaidSuccess = ref(false);

const { formatted: countdownFormatted, isExpired, start: startCountdown, stop: stopCountdown } = useCountdown();

const { start: startPolling, stop: stopPolling, currentOrder } = useOrderPolling({
  onPaid: (paidOrder) => {
    order.value = paidOrder;
    handlePaymentSuccess(paidOrder);
  },
  onExpired: (expiredOrder) => {
    order.value = expiredOrder;
    toast.error('Order Expired', 'The checkout payment window has lapsed.');
  },
});

watch(
  () => [props.isOpen, props.plan],
  async ([open, plan]) => {
    if (open && plan) {
      await initializeCheckout(plan as PlanDefinition);
    } else {
      cleanup();
    }
  },
  { immediate: true }
);

async function initializeCheckout(plan: PlanDefinition) {
  isCreatingOrder.value = true;
  isPaidSuccess.value = false;
  order.value = null;
  qrDataUrl.value = '';

  try {
    const newOrder = await api.createOrder({
      planId: plan.id,
      chainId: 1,
      tokenSymbol: 'USDT',
    });
    order.value = newOrder;

    // Generate high quality QR Code for deposit address
    const qr = await QRCode.toDataURL(newOrder.deposit_address, {
      width: 280,
      margin: 1,
      color: {
        dark: '#080b11',
        light: '#ffffff',
      },
    });
    qrDataUrl.value = qr;

    // Start countdown and status polling
    startCountdown(newOrder.expires_at);
    startPolling(newOrder.id);
  } catch (err: any) {
    toast.error('Failed to initiate checkout', err.message || 'Please try again later.');
    emit('close');
  } finally {
    isCreatingOrder.value = false;
  }
}

async function copyToClipboard(text: string, field: 'address' | 'amount') {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    copiedField.value = field;
    setTimeout(() => {
      if (copiedField.value === field) copiedField.value = null;
    }, 2000);
  } catch (err) {
    toast.warning('Clipboard Access', 'Could not copy automatically. Please copy manually.');
  }
}

async function handleManualVerify() {
  if (!order.value || isVerifying.value) return;
  isVerifying.value = true;

  try {
    const res = await api.verifyOrder(order.value.id);
    if (res.verified || res.order.status === 'paid') {
      order.value = res.order;
      handlePaymentSuccess(res.order);
    } else {
      toast.info('Payment Pending', 'On-chain transaction not yet confirmed. Please wait for network block confirmation.');
    }
  } catch (err: any) {
    toast.error('Verification Error', err.message || 'Could not verify payment.');
  } finally {
    isVerifying.value = false;
  }
}

function handlePaymentSuccess(paidOrder: OrderRecord) {
  isPaidSuccess.value = true;
  stopPolling();
  stopCountdown();
  toast.success('Payment Confirmed!', 'Your digital entitlement has been provisioned.');
  emit('success', paidOrder);
}

function handleGoToDashboard() {
  cleanup();
  emit('close');
  router.push('/dashboard');
}

function cleanup() {
  stopPolling();
  stopCountdown();
  order.value = null;
  qrDataUrl.value = '';
  isPaidSuccess.value = false;
}

function handleClose() {
  cleanup();
  emit('close');
}

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop with strong blur -->
    <div
      class="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
      @click="handleClose"
    />

    <!-- Dialog Card -->
    <div
      class="relative w-full max-w-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Close button -->
      <button
        type="button"
        class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20"
        @click="handleClose"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Loading State -->
      <div v-if="isCreatingOrder" class="py-20 text-center space-y-4">
        <div class="relative w-14 h-14 mx-auto">
          <div class="absolute inset-0 rounded-full border-2 border-brand-500/20 animate-ping"></div>
          <div class="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shadow-glow-brand">
            <Loader2 class="w-7 h-7 animate-spin" />
          </div>
        </div>
        <div>
          <h3 class="text-base font-display font-bold text-slate-900 dark:text-white">
            Deriving HD Child Deposit Address
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Communicating with Pay3 non-custodial daemon...
          </p>
        </div>
      </div>

      <!-- Payment Success Celebration State -->
      <div v-else-if="isPaidSuccess" class="p-8 sm:p-10 text-center space-y-6">
        <div class="w-20 h-20 rounded-3xl bg-brand-500/10 text-brand-500 mx-auto flex items-center justify-center shadow-glow-brand border border-brand-500/20">
          <CheckCircle2 class="w-10 h-10" />
        </div>
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 mb-2">
            On-Chain Block Confirmed
          </div>
          <h2 class="text-3xl font-display font-black text-slate-900 dark:text-white">
            Payment Verified!
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Your payment for <span class="font-bold text-slate-800 dark:text-slate-200">{{ plan?.name }}</span> has settled. Access tokens and bandwidth quota are now active.
          </p>
        </div>

        <button
          type="button"
          class="w-full py-3.5 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 shadow-glow-brand transition-all flex items-center justify-center gap-2"
          @click="handleGoToDashboard"
        >
          <span>Open User Dashboard</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Active Checkout View -->
      <div v-else-if="order" class="p-6 sm:p-8">
        <!-- Header -->
        <div class="flex items-start justify-between pb-5 border-b border-slate-100 dark:border-white/[0.06]">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Web3 Cashier
              </span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold">
                ERC20 USDT
              </span>
            </div>
            <h2 class="text-xl font-display font-bold text-slate-900 dark:text-white mt-1">
              {{ plan?.name }}
            </h2>
          </div>

          <!-- Expiration Countdown Badge -->
          <div
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold"
            :class="[
              isExpired
                ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-sm'
            ]"
          >
            <Clock class="w-3.5 h-3.5" />
            <span>{{ isExpired ? 'Expired' : countdownFormatted }}</span>
          </div>
        </div>

        <!-- Body Content -->
        <div class="py-6 space-y-6">
          <!-- QR Code and Payment Details Container -->
          <div class="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 dark:bg-dark-surface/60 p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.06]">
            <!-- High-Tech QR Code Card with Scanner Corner Reticles -->
            <div class="relative p-2.5 bg-white rounded-2xl shadow-md border border-slate-200 flex-shrink-0 group">
              <!-- Corner Scanner Reticles -->
              <div class="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-brand-500 rounded-tl-sm pointer-events-none"></div>
              <div class="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-brand-500 rounded-tr-sm pointer-events-none"></div>
              <div class="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-brand-500 rounded-bl-sm pointer-events-none"></div>
              <div class="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-brand-500 rounded-br-sm pointer-events-none"></div>

              <img
                v-if="qrDataUrl"
                :src="qrDataUrl"
                alt="Deposit Address QR"
                class="w-36 h-36 rounded-xl"
              />
            </div>

            <!-- Payment Instructions -->
            <div class="flex-1 space-y-3.5 w-full">
              <!-- Amount -->
              <div>
                <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">
                  Amount to Send
                </span>
                <div class="flex items-center justify-between mt-1 p-2.5 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
                  <span class="text-base font-mono font-black text-slate-900 dark:text-white">
                    {{ order.expected_amount }} USDT
                  </span>
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-brand-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Copy amount"
                    @click="copyToClipboard(order.expected_amount, 'amount')"
                  >
                    <Check v-if="copiedField === 'amount'" class="w-4 h-4 text-brand-500" />
                    <Copy v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Deposit Address -->
              <div>
                <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">
                  Unique Child Deposit Address
                </span>
                <div class="flex items-center justify-between mt-1 p-2.5 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
                  <span class="text-xs font-mono text-slate-800 dark:text-slate-200 truncate mr-2 select-all">
                    {{ order.deposit_address }}
                  </span>
                  <button
                    type="button"
                    class="p-1.5 text-slate-500 hover:text-brand-500 transition-colors flex-shrink-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Copy address"
                    @click="copyToClipboard(order.deposit_address, 'address')"
                  >
                    <Check v-if="copiedField === 'address'" class="w-4 h-4 text-brand-500" />
                    <Copy v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Non-Custodial Assurance Badge -->
          <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs">
            <ShieldCheck class="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-500" />
            <p class="leading-relaxed">
              Deposit only USDT to this dedicated Pay3 address. The background engine listens directly for chain Transfer events and provisions entitlements within 60 seconds.
            </p>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="pt-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-4">
          <!-- Real-Time Radar Scanner Pulse -->
          <div class="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span class="relative flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span>Listening to transfers...</span>
          </div>

          <button
            type="button"
            class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 shadow-md shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            :disabled="isVerifying || isExpired"
            @click="handleManualVerify"
          >
            <Loader2 v-if="isVerifying" class="w-3.5 h-3.5 animate-spin" />
            <span>I Have Sent Payment</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
