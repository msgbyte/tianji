import { Dayjs } from 'dayjs';
import { create } from 'zustand';

export enum DateRange {
  Realtime = 'realtime',
  Last24Hours = 'last24hours',
  Today = 'today',
  Yesterday = 'yesterday',
  ThisWeek = 'thisweek',
  Last7Days = 'last7days',
  ThisMonth = 'thismonth',
  Last30Days = 'last30days',
  Last90Days = 'last90days',
  ThisYear = 'thisyear',
  Custom = 'custom',
}

interface GlobalState {
  dateRange: DateRange;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  showPreviousPeriod: boolean;
}

export const useGlobalStateStore = create<GlobalState>(() => ({
  dateRange: DateRange.Last24Hours,
  startDate: null,
  endDate: null,
  showPreviousPeriod: false,
}));
