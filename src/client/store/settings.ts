import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  colorScheme: 'light' | 'dark' | 'system';
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    () =>
      ({
        colorScheme: 'dark' as const,
      }) as SettingsState,
    {
      name: 'settings',
    }
  )
);

export function useColorSchema() {
  const colorScheme = useSettingsStore((state) => state.colorScheme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (colorScheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(colorScheme);
  }, [colorScheme]);

  return colorScheme;
}

export function useTheme(): 'light' | 'dark' {
  const theme = useSettingsStore((state) => {
    if (state.colorScheme === 'system') {
      return typeof window !== 'undefined'
        ? window?.matchMedia('(prefers-color-scheme: dark)')?.matches
          ? 'dark'
          : 'light'
        : 'light';
    } else {
      return state.colorScheme;
    }
  });

  return theme;
}
