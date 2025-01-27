import { pullAt } from 'lodash-es';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface MetricsInfo {
  name: string;
  math: 'events' | 'sessions';
}

interface InsightsState {
  selectedWebsiteId: string;
  currentMetrics: (MetricsInfo | null)[];
  reset: () => void;
  setMetrics: (index: number, info: MetricsInfo) => void;
  addMetrics: () => void;
  removeMetrics: (index: number) => void;
}

export const useInsightsStore = create<InsightsState>()(
  immer(
    persist(
      (set) => ({
        selectedWebsiteId: '',
        currentMetrics: [null],
        reset: () => {
          set(() => ({
            selectedWebsiteId: '',
            currentMetrics: [null],
          }));
        },
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
        removeMetrics: (index: number) => {
          set((state) => {
            // delete state.currentMetrics[index];
            pullAt(state.currentMetrics, index);
          });
        },
      }),
      {
        name: 'insights',
      }
    )
  )
);
