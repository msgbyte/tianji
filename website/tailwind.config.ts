import type { Config } from 'tailwindcss';
import { PluginCreator } from 'tailwindcss/types/config';

const plugin: PluginCreator = (api) => {
  api.addUtilities({
    '.text-gradient': {
      background:
        'linear-gradient(270deg, #00E725 -33.33%, #0799B9 17.93%, #940DFF 105.3%)',
      backgroundClip: 'text',
      color: 'transparent',
    },
  });
};

export default {
  corePlugins: {
    preflight: false,
  },
  content: ['./src/**/*.{html,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [plugin],
} satisfies Config;
