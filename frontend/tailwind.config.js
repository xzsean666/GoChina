/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          accent: '#06b6d4',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          gold: '#f59e0b',
        },
        dark: {
          bg: '#080b11',
          surface: '#0d131f',
          card: '#111927',
          border: '#1e293b',
          muted: '#334155',
          text: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-brand': '0 0 30px -5px rgba(16, 185, 129, 0.25)',
        'glow-cyan': '0 0 30px -5px rgba(6, 182, 212, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(ellipse at 50% -20%, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
        'radial-cyan': 'radial-gradient(ellipse at 50% -20%, rgba(6, 182, 212, 0.18) 0%, transparent 70%)',
      }
    },
  },
  plugins: [],
};
