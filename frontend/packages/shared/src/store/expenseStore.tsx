import { create } from 'zustand';
import React from 'react';

interface ExpenseState {
    refreshTrigger: number;
    refreshExpenses: () => void;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
    refreshTrigger: 0,
    refreshExpenses: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));

/**
 * Legacy Support for Budget Planner MFE
 */
export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

export const useExpenses = () => {
    const { refreshTrigger, refreshExpenses } = useExpenseStore();
    return {
        refreshTrigger,
        triggerRefresh: refreshExpenses
    };
};
