import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f5ff',
          100: '#e0e6ff',
          200: '#c3cfff',
          300: '#94acff',
          400: '#6280ff',
          500: '#4b5dff',
          600: '#3c45e6',
          700: '#3137b3',
          800: '#282d8c',
          900: '#1f236a',
        },
        play: '#ffb347',
        learn: '#6ddccf',
        protect: '#ff6f91',
        midnight: '#0f172a',
      },
      fontFamily: {
        display: ['var(--font-display)', '"Baloo 2"', 'cursive'],
        body: ['var(--font-body)', '"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
