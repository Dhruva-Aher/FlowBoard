import type { Config } from 'tailwindcss'

/** Kept for shadcn components.json path; theme lives in src/index.css (Tailwind v4). */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
} satisfies Config
