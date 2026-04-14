import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'ping-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        shimmer:     'shimmer 0.6s ease-in-out',
        'ping-slow': 'ping-slow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
