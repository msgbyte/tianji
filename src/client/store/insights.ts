import { MetricsInfo, FilterInfo, GroupInfo } from '@tianji/shared';
import { pullAt } from 'lodash-es';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface InsightsState {
  insightId: string;
  insightType: 'website' | 'survey';
  currentMetrics: (MetricsInfo | null)[];
  currentFilters: (FilterInfo | null)[];
  currentGroups: (GroupInfo | null)[];
  reset: () => void;
  setMetrics: (index: number, info: MetricsInfo) => void;
  addMetrics: () => void;
  removeMetrics: (index: number) => void;
  setFilter: (index: number, info: FilterInfo) => void;
  addFilter: () => void;
  removeFilter: (index: number) => void;
  setGroups: (index: number, info: GroupInfo) => void;
  addGroups: () => void;
  removeGroups: (index: number) => void;
}

export const useInsightsStore = create<InsightsState>()(
  immer(
    persist(
      (set) => ({
        insightId: '',
        insightType: 'website',
        currentMetrics: [null],
        currentFilters: [null],
        currentGroups: [null],
        reset: () => {
          set(() => ({
            selectedWebsiteId: '',
            currentMetrics: [null],
            currentFilters: [null],
            currentGroups: [null],
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
            pullAt(state.currentMetrics, index);
          });
        },
        setFilter: (index, info) => {
          set((state) => {
            state.currentFilters[index] = info;
          });
        },
        addFilter: () => {
          set((state) => {
            state.currentFilters[state.currentFilters.length] = null;
          });
        },
        removeFilter: (index: number) => {
          set((state) => {
            pullAt(state.currentFilters, index);
          });
        },
        setGroups: (index, info) => {
          set((state) => {
            state.currentGroups[index] = info;
          });
        },
        addGroups: () => {
          set((state) => {
            state.currentGroups[state.currentGroups.length] = null;
          });
        },
        removeGroups: (index: number) => {
          set((state) => {
            pullAt(state.currentGroups, index);
          });
        },
      }),
      {
        name: 'insights',
      }
    )
  )
);
