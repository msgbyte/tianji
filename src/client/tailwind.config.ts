import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: {
    relative: true,
    files: [
      './index.html',
      './components/**/*.{js,jsx,ts,tsx}',
      './pages/**/*.{js,jsx,ts,tsx}',
    ],
  },
  theme: {
    extend: {
      colors: {
        gray: colors.neutral,
      },
    },
  },
  darkMode: 'class',
  corePlugins: {
    preflight: false,
  },
  plugins: [],
} satisfies Config;
