import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface UserProfile {
  id: string;
  role: 'user' | 'admin';
  email?: string;
  address?: string;
  created_at?: number;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('gc_token') : null
  );

  const user = ref<UserProfile | null>(
    typeof localStorage !== 'undefined' && localStorage.getItem('gc_user')
      ? JSON.parse(localStorage.getItem('gc_user') || 'null')
      : null
  );

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  function setSession(newToken: string, newUser: UserProfile) {
    token.value = newToken;
    user.value = newUser;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gc_token', newToken);
      localStorage.setItem('gc_user', JSON.stringify(newUser));
    }
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('gc_token');
      localStorage.removeItem('gc_user');
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    setSession,
    clearSession,
  };
});
