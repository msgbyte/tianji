import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InsightsState {
  selectedWebsiteId: string;
}

export const useInsightsStore = create<InsightsState>()(
  persist(
    () => ({
      selectedWebsiteId: '',
    }),
    {
      name: 'insights',
    }
  )
);
