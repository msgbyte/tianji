/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2563eb';
const tintColorDark = '#60a5fa';

export const Colors = {
  light: {
    text: '#1e293b',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#64748b',
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorLight,
    cardBackground: '#f8fafc',
    border: '#e2e8f0',
  },
  dark: {
    text: '#f1f5f9',
    background: '#0f172a',
    tint: tintColorDark,
    icon: '#94a3b8',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    cardBackground: '#1e293b',
    border: '#334155',
  },
};
