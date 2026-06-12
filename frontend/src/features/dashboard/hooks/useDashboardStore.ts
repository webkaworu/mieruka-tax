import { create } from 'zustand';

type ViewMode = 'donut' | 'treemap';

interface DashboardState {
  selectedYear: number;
  lgCode: string;
  viewMode: ViewMode;
  history: { id: string | null; name: string }[];
  setSelectedYear: (year: number) => void;
  setLgCode: (code: string) => void;
  setViewMode: (mode: ViewMode) => void;
  drillDown: (id: string | null, name: string) => void;
  goBack: () => void;
  resetHistory: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedYear: 2024,
  lgCode: '000000',
  viewMode: 'treemap',
  history: [{ id: null, name: '全体' }],
  setSelectedYear: (year) => set({ selectedYear: year }),
  setLgCode: (code) => set({ lgCode: code }),
  setViewMode: (mode) => set({ viewMode: mode }),
  drillDown: (id, name) =>
    set((state) => ({
      history: [...state.history, { id, name }],
    })),
  goBack: () =>
    set((state) => {
      if (state.history.length > 1) {
        return { history: state.history.slice(0, -1) };
      }
      return {};
    }),
  resetHistory: () => set({ history: [{ id: null, name: '全体' }] }),
}));
