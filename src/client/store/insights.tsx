import { MetricsInfo, FilterInfo, GroupInfo } from '@tianji/shared';
import { pullAt } from 'lodash-es';
import { create, StoreApi, UseBoundStore, useStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { DateUnit } from '@tianji/shared';
import { TimeEventChartType } from '../components/chart/TimeEventChart';
import dayjs from 'dayjs';
import { createContext, PropsWithChildren, useContext, useRef } from 'react';
import React from 'react';

export type InsightType = 'website' | 'survey' | 'aigateway' | 'warehouse';

interface InsightsState {
  insightId: string;
  insightType: InsightType;
  currentMetrics: (MetricsInfo | null)[];
  currentFilters: (FilterInfo | null)[];
  currentGroups: (GroupInfo | null)[];
  currentDateKey: string;
  currentDateRange: [Date, Date];
  currentDateUnit: DateUnit;
  currentChartType: TimeEventChartType;
  reset: () => void;
  setInsightTarget: (id: string, type: InsightType) => void;
  setMetrics: (index: number, info: MetricsInfo) => void;
  addMetrics: () => void;
  removeMetrics: (index: number) => void;
  setFilter: (index: number, info: FilterInfo) => void;
  addFilter: () => void;
  removeFilter: (index: number) => void;
  setGroups: (index: number, info: GroupInfo) => void;
  addGroups: () => void;
  removeGroups: (index: number) => void;
  setCurrentDateKey: (key: string) => void;
  setCurrentDateRange: (range: [Date, Date]) => void;
  setCurrentDateUnit: (unit: DateUnit) => void;
  setCurrentChartType: (type: TimeEventChartType) => void;
}

function createInsightsStore() {
  return create<InsightsState>()(
    immer(
      persist(
        (set) => ({
          insightId: '',
          insightType: 'website',
          currentMetrics: [],
          currentFilters: [],
          currentGroups: [],
          currentDateKey: '30D',
          currentDateRange: [
            dayjs().subtract(30, 'day').startOf('day').toDate(),
            dayjs().endOf('day').toDate(),
          ],
          currentDateUnit: 'day',
          currentChartType: 'line',
          reset: () => {
            set(() => ({
              insightId: '',
              insightType: 'website',
              currentMetrics: [],
              currentFilters: [],
              currentGroups: [],
              currentDateKey: '30D',
              currentDateRange: [
                dayjs().subtract(30, 'day').startOf('day').toDate(),
                dayjs().endOf('day').toDate(),
              ],
              currentDateUnit: 'day',
              currentChartType: 'line',
            }));
          },
          setInsightTarget: (id: string, type: InsightType) => {
            set((state) => {
              state.insightId = id;
              state.insightType = type;
              state.currentMetrics = [];
              state.currentFilters = [];
              state.currentGroups = [];
            });
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
          setCurrentDateKey: (key) => {
            set((state) => {
              state.currentDateKey = key;
            });
          },
          setCurrentDateRange: (range) => {
            set((state) => {
              state.currentDateRange = range;
            });
          },
          setCurrentDateUnit: (unit) => {
            set((state) => {
              state.currentDateUnit = unit;
            });
          },
          setCurrentChartType: (type) => {
            set((state) => {
              state.currentChartType = type;
            });
          },
        }),
        {
          name: 'insights',
        }
      )
    )
  );
}

type InsightsStoreContextType = UseBoundStore<StoreApi<InsightsState>>;
const InsightsStoreContext = createContext<InsightsStoreContextType | null>(
  null
);

export const InsightsStoreProvider: React.FC<PropsWithChildren> = React.memo(
  ({ children }) => {
    const storeRef = useRef<InsightsStoreContextType | null>(null);
    if (storeRef.current === null) {
      storeRef.current = createInsightsStore();
    }

    return (
      <InsightsStoreContext.Provider value={storeRef.current}>
        {children}
      </InsightsStoreContext.Provider>
    );
  }
);
InsightsStoreProvider.displayName = 'InsightsStoreProvider';

export function useInsightsStore<T>(selector: (state: InsightsState) => T): T {
  const store = useContext(InsightsStoreContext);
  if (!store) {
    throw new Error('Missing InsightsStoreContext');
  }

  return useStore(store, selector);
}
