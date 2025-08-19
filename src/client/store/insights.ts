import { MetricsInfo, FilterInfo, GroupInfo } from '@tianji/shared';
import { pullAt } from 'lodash-es';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { DateUnit } from '@tianji/shared';
import { TimeEventChartType } from '../components/chart/TimeEventChart';
import dayjs from 'dayjs';

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

export const useInsightsStore = create<InsightsState>()(
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
            state.currentMetrics = [null];
            state.currentFilters = [null];
            state.currentGroups = [null];
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
