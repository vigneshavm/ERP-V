import { create } from 'zustand';

interface ExpenseState {
    refreshTrigger: number;
    refreshExpenses: () => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
    refreshTrigger: 0,
    refreshExpenses: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
