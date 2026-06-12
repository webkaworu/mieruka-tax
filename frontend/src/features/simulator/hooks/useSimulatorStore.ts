import { create } from 'zustand';

interface SimulatorState {
  taxAmount: number;
  setTaxAmount: (amount: number) => void;
  income: number;
  setIncome: (amount: number) => void;
}

export const useSimulatorStore = create<SimulatorState>((set) => ({
  taxAmount: 0,
  setTaxAmount: (amount) => set({ taxAmount: amount }),
  income: 0,
  setIncome: (amount) => set({ income: amount }),
}));
