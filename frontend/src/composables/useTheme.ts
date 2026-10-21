import { ref, onMounted } from 'vue';

const isDark = ref(true);

export function useTheme() {
  function applyTheme(dark: boolean) {
    isDark.value = dark;
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  function toggleTheme() {
    applyTheme(!isDark.value);
  }

  function initTheme() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('theme');
    if (saved) {
      applyTheme(saved === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark);
    }
  }

  return {
    isDark,
    toggleTheme,
    initTheme,
  };
}
