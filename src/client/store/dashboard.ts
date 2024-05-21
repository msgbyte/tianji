import { create } from 'zustand';
import { Layouts, Layout } from 'react-grid-layout';
import { mapValues } from 'lodash-es';
import { v1 as uuid } from 'uuid';
import { MonitorDataChart } from '../monitor/MonitorDataChart';

export type DashboardItemType =
  | 'websiteOverview'
  | 'websiteEvents'
  | 'monitorHealthBar'
  | 'monitorMetrics'
  | 'monitorChart'
  | 'monitorEvents'
  | 'monitorDataChart';

export interface DashboardItem {
  key: string;
  id: string;
  title: string;
  type: DashboardItemType;
}

interface DashboardState {
  isEditMode: boolean;
  switchEditMode: () => void;
  layouts: Layouts;
  items: DashboardItem[];
  addItem: (type: DashboardItemType, id: string, title: string) => void;
  removeItem: (key: string) => void;
  changeItemTitle: (key: string, title: string) => void;
}

export const defaultBlankLayouts = {
  lg: [],
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
  isEditMode: false,
  layouts: defaultBlankLayouts,
  items: [],
  switchEditMode: () => {
    set({ isEditMode: !get().isEditMode });
  },
  addItem: (type: DashboardItemType, id: string, title: string) => {
    const key = uuid();

    set((state) => {
      return {
        layouts: mapValues(state.layouts, (layout) => [
          ...layout,
          { ...defaultItemLayout[type], i: key },
        ]),
        items: [
          ...state.items,
          {
            key,
            id,
            title,
            type,
          },
        ],
      };
    });
  },
  removeItem: (key: string) => {
    set((state) => {
      return {
        layouts: mapValues(state.layouts, (layout) =>
          layout.filter((l) => l.i !== key)
        ),
        items: state.items.filter((item) => item.key !== key),
      };
    });
  },
  changeItemTitle: (key: string, title: string) => {
    set((state) => {
      return {
        items: state.items.map((item) => {
          if (item.key === key) {
            return {
              ...item,
              title,
            };
          } else {
            return item;
          }
        }),
      };
    });
  },
}));

export const defaultItemLayout: Record<DashboardItemType, Omit<Layout, 'i'>> = {
  websiteOverview: { x: 0, y: Infinity, w: 4, h: 12 },
  websiteEvents: { x: 0, y: Infinity, w: 2, h: 5 },
  monitorHealthBar: { x: 0, y: Infinity, w: 2, h: 2 },
  monitorMetrics: { x: 0, y: Infinity, w: 2, h: 3 },
  monitorChart: { x: 0, y: Infinity, w: 2, h: 6 },
  monitorEvents: { x: 0, y: Infinity, w: 2, h: 10 },
  monitorDataChart: { x: 0, y: Infinity, w: 2, h: 8 },
};

// Add the MonitorDataChart component to be shown
export const MonitorDataChartComponent = () => {
  return <MonitorDataChart />;
};
