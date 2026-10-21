<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Navbar from '@/components/layout/Navbar.vue';
import MobileDrawer from '@/components/layout/MobileDrawer.vue';
import Footer from '@/components/layout/Footer.vue';
import ToastContainer from '@/components/layout/ToastContainer.vue';
import AuthModal from '@/components/auth/AuthModal.vue';
import CheckoutModal from '@/components/checkout/CheckoutModal.vue';
import FloatingChatBubble from '@/components/chat/FloatingChatBubble.vue';
import type { PlanDefinition } from '@/api/client';
import { useTheme } from '@/composables/useTheme';
import { useI18n } from '@/composables/useI18n';

const { initTheme } = useTheme();
const { initLocale } = useI18n();

const isMobileOpen = ref(false);
const isAuthOpen = ref(false);
const isCheckoutOpen = ref(false);
const selectedPlan = ref<PlanDefinition | null>(null);

onMounted(() => {
  initTheme();
  initLocale();
});

function handleOpenAuth() {
  isAuthOpen.value = true;
}

function handleCloseAuth() {
  isAuthOpen.value = false;
}

function handleToggleMobile() {
  isMobileOpen.value = !isMobileOpen.value;
}

function handleCloseMobile() {
  isMobileOpen.value = false;
}

function handleSelectPlan(plan: PlanDefinition) {
  selectedPlan.value = plan;
  isCheckoutOpen.value = true;
}

function handleCloseCheckout() {
  isCheckoutOpen.value = false;
  selectedPlan.value = null;
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-100 transition-colors duration-200 relative selection:bg-brand-500 selection:text-white">
    <!-- Tactile Noise Texture Overlay -->
    <div class="noise-overlay" aria-hidden="true"></div>

    <!-- Ambient Glow Spots -->
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-brand-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" aria-hidden="true"></div>

    <!-- Navigation Bar -->
    <Navbar
      @open-auth="handleOpenAuth"
      @toggle-mobile="handleToggleMobile"
    />

    <!-- Mobile Slideover Drawer -->
    <MobileDrawer
      :is-open="isMobileOpen"
      @close="handleCloseMobile"
      @open-auth="handleOpenAuth"
    />

    <!-- Main View Content Area -->
    <main class="flex-1 relative z-10">
      <router-view
        :is-auth-open="isAuthOpen"
        @open-auth="handleOpenAuth"
        @close-auth="handleCloseAuth"
        @select-plan="handleSelectPlan"
      />
    </main>

    <!-- Global Footer -->
    <Footer />

    <!-- Global Auth Modal -->
    <AuthModal
      :is-open="isAuthOpen"
      @close="handleCloseAuth"
    />

    <!-- Global Checkout Modal -->
    <CheckoutModal
      :is-open="isCheckoutOpen"
      :plan="selectedPlan"
      @close="handleCloseCheckout"
    />

    <!-- Global Toast Container -->
    <ToastContainer />

    <!-- Global Built-in Floating Support Chat Bubble -->
    <FloatingChatBubble />
  </div>
</template>
