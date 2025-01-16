import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface MetricsInfo {
  name: string;
}

interface InsightsState {
  selectedWebsiteId: string;
  currentMetrics: (MetricsInfo | null)[];
  setMetrics: (index: number, info: MetricsInfo) => void;
  addMetrics: () => void;
}

export const useInsightsStore = create<InsightsState>()(
  immer(
    persist(
      (set) => ({
        selectedWebsiteId: '',
        currentMetrics: [null],
        setMetrics: (index, info) => {
          set((state) => {
            state.currentMetrics[index] = info;
          });
        },
        addMetrics: () => {
          set((state) => {
            state.currentMetrics[state.currentMetrics.length] = null;
          });
        },
      }),
      {
        name: 'insights',
      }
    )
  )
);
