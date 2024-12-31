import { create } from 'zustand';

interface StatusPageStore {
  lastUpdatedAt: number;
  updateLastUpdatedAt: (lastUpdatedAt: number) => void;
}
export const useStatusPageStore = create<StatusPageStore>((set, get) => ({
  lastUpdatedAt: 0,
  updateLastUpdatedAt: (lastUpdatedAt: number) => {
    set((state) => ({
      lastUpdatedAt: Math.max(lastUpdatedAt, state.lastUpdatedAt),
    }));
  },
}));
