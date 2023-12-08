import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  colorScheme: 'light' | 'dark';
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    () =>
      ({
        colorScheme: 'light' as const,
      } as SettingsState),
    {
      name: 'settings',
    }
  )
);
