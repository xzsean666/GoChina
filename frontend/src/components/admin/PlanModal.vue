<script setup lang="ts">
import { ref, watch } from 'vue';
import { api, type PlanDefinition } from '@/api/client';
import { useToast } from '@/composables/useToast';
import { X, Loader2, Save } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  plan: PlanDefinition | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved', plan: PlanDefinition): void;
}>();

const { toast } = useToast();
const isSaving = ref(false);

const form = ref({
  id: '',
  name: '',
  category: 'Pro',
  description: '',
  price_usd: 19.99,
  currency: 'USDT',
  duration_days: 30,
  quota_gb: 100,
  features_raw: '',
  enabled: true,
});

watch(
  () => [props.isOpen, props.plan],
  ([open, p]) => {
    if (open) {
      if (p) {
        const existing = p as PlanDefinition;
        form.value = {
          id: existing.id,
          name: existing.name,
          category: existing.category,
          description: existing.description,
          price_usd: existing.price_usd,
          currency: existing.currency,
          duration_days: existing.duration_days,
          quota_gb: Math.round(existing.quota_limit / (1024 * 1024 * 1024)),
          features_raw: existing.features.join('\n'),
          enabled: existing.enabled,
        };
      } else {
        form.value = {
          id: `plan_${Date.now().toString(36)}`,
          name: '',
          category: 'Pro',
          description: '',
          price_usd: 19.99,
          currency: 'USDT',
          duration_days: 30,
          quota_gb: 100,
          features_raw: 'Dedicated Edge Routing\nGlobal Anycast Acceleration\n24/7 Priority Support',
          enabled: true,
        };
      }
    }
  },
  { immediate: true }
);

async function handleSave() {
  if (!form.value.id || !form.value.name) {
    toast.warning('Validation Error', 'Plan ID and Name are required.');
    return;
  }

  isSaving.value = true;
  try {
    const features = form.value.features_raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const planPayload: PlanDefinition = {
      id: form.value.id,
      name: form.value.name,
      category: form.value.category,
      description: form.value.description,
      price_usd: Number(form.value.price_usd),
      currency: form.value.currency,
      duration_days: Number(form.value.duration_days),
      quota_limit: Number(form.value.quota_gb) * 1024 * 1024 * 1024,
      features,
      enabled: form.value.enabled,
    };

    const saved = await api.saveAdminPlan(planPayload);
    toast.success('Plan Saved', `Plan ${saved.name} updated successfully.`);
    emit('saved', saved);
    emit('close');
  } catch (err: any) {
    toast.error('Failed to save plan', err.message || 'Please check input parameters.');
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300" @click="emit('close')" />

    <!-- Dialog -->
    <div
      class="relative w-full max-w-lg bg-white dark:bg-dark-card border border-slate-200 dark:border-white/[0.08] rounded-3xl shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <button
        type="button"
        class="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        @click="emit('close')"
      >
        <X class="w-5 h-5" />
      </button>

      <h3 class="text-xl font-display font-extrabold text-slate-900 dark:text-white mb-5">
        {{ plan ? 'Edit Service Plan' : 'Create New Service Plan' }}
      </h3>

      <form class="space-y-4 text-xs" @submit.prevent="handleSave">
        <!-- Plan ID & Name -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Plan ID</label>
            <input
              v-model="form.id"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-dark-surface font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              :disabled="!!plan"
              required
            />
          </div>
          <div>
            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Plan Name</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              required
            />
          </div>
        </div>

        <!-- Category & Price -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <input
              v-model="form.category"
              type="text"
              placeholder="Basic, Pro, Enterprise"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              required
            />
          </div>
          <div>
            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Price (USD)</label>
            <input
              v-model.number="form.price_usd"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-dark-surface font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              required
            />
          </div>
        </div>

        <!-- Duration & Quota -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Validity (Days)</label>
            <input
              v-model.number="form.duration_days"
              type="number"
              min="1"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-dark-surface font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              required
            />
          </div>
          <div>
            <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Quota (GB)</label>
            <input
              v-model.number="form.quota_gb"
              type="number"
              min="0"
              class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-dark-surface font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              required
            />
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <input
            v-model="form.description"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        <!-- Features -->
        <div>
          <label class="block font-medium text-slate-700 dark:text-slate-300 mb-1">Features (one per line)</label>
          <textarea
            v-model="form.features_raw"
            rows="3"
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-dark-surface text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        <!-- Enabled Switch -->
        <div class="flex items-center gap-2.5 pt-1">
          <input
            id="plan-enabled"
            v-model="form.enabled"
            type="checkbox"
            class="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
          />
          <label for="plan-enabled" class="font-medium text-slate-700 dark:text-slate-300">
            Publish plan to public catalog
          </label>
        </div>

        <!-- Actions -->
        <div class="pt-5 border-t border-slate-100 dark:border-white/[0.06] flex justify-end gap-2.5">
          <button
            type="button"
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 shadow-glow-brand flex items-center gap-1.5"
            :disabled="isSaving"
          >
            <Loader2 v-if="isSaving" class="w-3.5 h-3.5 animate-spin" />
            <Save v-else class="w-3.5 h-3.5" />
            <span>Save Plan</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
