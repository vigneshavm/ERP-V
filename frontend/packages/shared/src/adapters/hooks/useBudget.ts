"use client";

import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { PersonalBudget } from '../types';

export const useBudget = () => {
    const adapter = useData();
    const [budget, setBudget] = useState<PersonalBudget | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadBudget = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adapter.getBudget();
            setBudget(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [adapter]);

    useEffect(() => {
        loadBudget();
    }, [loadBudget]);

    const updateMode = async (mode: 'zero-based' | 'flexible') => {
        if (!budget) return;
        const original = { ...budget };
        setBudget({ ...budget, mode });

        try {
            const updated = await adapter.updateBudgetMode(mode);
            setBudget(updated);
            return updated;
        } catch (err) {
            setBudget(original);
            throw err;
        }
    };

    const updateCategoryAllotment = async (categoryId: string, allotted: number) => {
        if (!budget) return;
        const original = { ...budget };
        
        // Optimistically update
        const updatedCategoryBudgets = budget.categoryBudgets.map(cb => 
            cb.categoryId === categoryId ? { ...cb, allotted } : cb
        );
        setBudget({ ...budget, categoryBudgets: updatedCategoryBudgets });

        try {
            const updated = await adapter.updateCategoryBudget(categoryId, allotted);
            setBudget(updated);
            return updated;
        } catch (err) {
            setBudget(original);
            throw err;
        }
    };

    return { budget, loading, error, refresh: loadBudget, updateMode, updateCategoryAllotment };
};
