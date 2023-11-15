import { create } from 'zustand';
import { Layouts, Layout } from 'react-grid-layout';
import { mapValues } from 'lodash';
import { v1 as uuid } from 'uuid';

export type DashboardItemType =
  | 'websiteOverview'
  | 'websiteEvent'
  | 'monitorHealthBar'
  | 'monitorStatus'
  | 'monitorChart'
  | 'monitorEvent'
  | 'serverStatus';

export interface DashboardItem {
  key: string; // match with layout, not equal
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
}));

export const defaultItemLayout: Record<DashboardItemType, Omit<Layout, 'i'>> = {
  websiteOverview: { x: Infinity, y: Infinity, w: 4, h: 12 },
  websiteEvent: { x: Infinity, y: Infinity, w: 2, h: 5 },
  monitorHealthBar: { x: Infinity, y: Infinity, w: 1, h: 2 },
  monitorStatus: { x: Infinity, y: Infinity, w: 4, h: 2 },
  monitorChart: { x: Infinity, y: Infinity, w: 4, h: 2 },
  monitorEvent: { x: Infinity, y: Infinity, w: 4, h: 2 },
  serverStatus: { x: Infinity, y: Infinity, w: 4, h: 2 },
};
