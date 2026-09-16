import type { Config } from 'tailwindcss';

export default {
  prefix: 'tw-',
  corePlugins: { preflight: false },
  content: [
    './app/analytics/**/*.{ts,tsx}',
    './components/analytics/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F0E8',
        panel: '#FFFFFF',
        sidebar: '#17130F',
        graphite: '#27231F',
        muted: '#847B70',
        bronze: '#A9784F',
        gold: '#B9945A',
        positive: '#4F7A5B',
      },
      borderRadius: {
        panel: '16px',
      },
      boxShadow: {
        panel: '0 10px 30px rgba(39, 35, 31, 0.06)',
      },
    },
  },
} satisfies Config;
