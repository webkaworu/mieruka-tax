import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DataType, AccountType } from '@mieruka-tax/shared';

interface CategoryPathNode {
  id: string;
  name: string;
}

interface NationalFiscalState {
  year: number;
  dataType: DataType;
  accountType: AccountType;
  budgetRevision: number; // 0 = 当初予算, 1 = 補正第1号, etc.
  chartType: 'treemap' | 'donut';
  categoryPath: CategoryPathNode[]; // ドリルダウンのパンくず用

  // Actions
  setYear: (year: number) => void;
  setDataType: (dataType: DataType) => void;
  setAccountType: (accountType: AccountType) => void;
  setBudgetRevision: (revision: number) => void;
  setChartType: (chartType: 'treemap' | 'donut') => void;
  pushCategory: (id: string, name: string) => void;
  popCategory: () => void;
  resetCategoryPath: () => void;
  resetAll: () => void;
}

const DEFAULT_YEAR = 2024; // 決算の最新公開年度（ダミーデータ等で2024まで公開と定義）

export const useNationalFiscalStore = create<NationalFiscalState>()(
  persist(
    (set) => ({
      year: DEFAULT_YEAR,
      dataType: 'settlement', // 初期表示は「決算」の最新公開年度
      accountType: 'general', // 初期表示は「一般会計」
      budgetRevision: 0,
      chartType: 'treemap', // デフォルトはツリーマップ
      categoryPath: [],

      setYear: (year) => set({ year }),
      setDataType: (dataType) => set({ dataType, budgetRevision: 0, categoryPath: [] }), // 決算に切り替えた場合は補正予算は無効（または当初＝0）
      setAccountType: (accountType) => set({ accountType, categoryPath: [] }),
      setBudgetRevision: (budgetRevision) => set({ budgetRevision }),
      setChartType: (chartType) => set({ chartType }),
      pushCategory: (id, name) => 
        set((state) => ({ 
          categoryPath: [...state.categoryPath, { id, name }] 
        })),
      popCategory: () => 
        set((state) => ({ 
          categoryPath: state.categoryPath.slice(0, -1) 
        })),
      resetCategoryPath: () => set({ categoryPath: [] }),
      resetAll: () => set({
        year: DEFAULT_YEAR,
        dataType: 'settlement',
        accountType: 'general',
        budgetRevision: 0,
        chartType: 'treemap',
        categoryPath: []
      })
    }),
    {
      name: 'national-fiscal-store', // localStorageのキー名
    }
  )
);
